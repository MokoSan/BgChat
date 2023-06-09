import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import CircularProgress from '@mui/material/CircularProgress';

export default function Home() {

  const [userInput, setUserInput] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      "message": "Hi there! Ask me a Bhagwat Gita related question.",
      "type": "apiMessage"
    }
  ]);

  const messageListRef = useRef(null);
  const textAreaRef = useRef(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    const messageList = messageListRef.current;
    messageList.scrollTop = messageList.scrollHeight;
  }, [messages]);

  // Focus on text field on load
  useEffect(() => {
    textAreaRef.current.focus();
  }, []);

  // Handle errors
  const handleError = () => {
    setMessages((prevMessages) => [...prevMessages, { "message": "Oops! There seems to be an error. Please try again.", "type": "apiMessage" }]);
    setLoading(false);
    setUserInput("");
  }

  // Handle form submission
  const handleSubmit = async(e) => {
    e.preventDefault();

    if (userInput.trim() === "") {
      return;
    }

    setLoading(true);
    setMessages((prevMessages) => [...prevMessages, { "message": userInput, "type": "userMessage" }]);

    // Send user question and history to API
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
        body: JSON.stringify({ userInput, }),
    });

    if (!response.ok) {
      handleError();
      return;
  }

    // Reset user input
    setUserInput("");
    const data = response.body;

    if (!data) {
      return;
    }

    const decoder = new TextDecoder();
    let done = false;

    const reader = data.getReader();
    let initial = `Answering: ${userInput}   - `;
    let re = ``;

    let counter = 0
    let stateBefore = messages.slice()
    setMessages((prevMessages) => [...prevMessages, { "message": userInput, "type": "userMessage" }]);

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      re += chunkValue;

      // Every 5 tokens, pop out the running token and add the new one.
      if (counter % 2 === 0) {
        let data = messages;
        let runner = initial + re;
        setMessages((prevMessages) => [...data, { "message": runner, "type": "apiMessage" }]);
      }

      ++counter;
    }

    setMessages((prevMessages) => [...stateBefore, { "message": userInput, "type": "userMessage" }]);
    setMessages((prevMessages) => [...prevMessages, { "message": re, "type": "apiMessage" }]);
    setLoading(false);
  };

  // Prevent blank submissions and allow for multiline input
  const handleEnter = (e) => {
    if (e.key === "Enter" && userInput) {
      if(!e.shiftKey && userInput) {
        handleSubmit(e);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  // Keep history in sync with messages
  useEffect(() => {
    if (messages.length >= 3) {
      setHistory([[messages[messages.length - 2].message, messages[messages.length - 1].message]]);
    }
    }, [messages])

  return (
    <>
      <Head>
        <title>Bhagwat Gita Chat</title>
        <meta name="description" content="GC documentation chatbot" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.topnav}>
      <div className = {styles.navlogo}>
    <a href="/">Bhagwat Gita Chat</a>
    </div>
</div>
      <main className={styles.main}>
      <div className = {styles.cloud}>
        <div ref={messageListRef} className = {styles.messagelist}>
        {messages.map((message, index) => {
          return (
            // The latest message sent by the user will be animated while waiting for a response
              <div key = {index} className = {message.type === "userMessage" && loading && index === messages.length - 1  ? styles.usermessagewaiting : message.type === "apiMessage" ? styles.apimessage : styles.usermessage}>
                {/* Display the correct icon depending on the message type */}
                {message.type === "apiMessage" ? <Image src = "/ai.png" alt = "AI" width = "30" height = "30" className = {styles.boticon} priority = {true} /> : <Image src = "/usericon.png" alt = "Me" width = "30" height = "30" className = {styles.usericon} priority = {true} />}
              <div className = {styles.markdownanswer}>
                {/* Messages are being rendered in Markdown format */}
                <ReactMarkdown linkTarget = {"_blank"}>{message.message}</ReactMarkdown>
                </div>
              </div>
          )
        })}
        </div>
            </div>
           <div className={styles.center}>
            
            <div className = {styles.cloudform}>
           <form onSubmit = {handleSubmit}>
          <textarea 
          disabled = {loading}
          onKeyDown={handleEnter}
          ref = {textAreaRef}
          autoFocus = {false}
          rows = {1}
          maxLength = {1000000000}
          type="text" 
          id="userInput" 
          name="userInput" 
          placeholder = {loading? "Waiting for response..." : "Type your question..."}  
          value = {userInput} 
          onChange = {e => setUserInput(e.target.value)} 
          className = {styles.textarea}
          />
            <button 
            type = "submit" 
            disabled = {loading}
            className = {styles.generatebutton}
            >
            {loading ? <div className = {styles.loadingwheel}><CircularProgress color="inherit" size = {20}/> </div> : 
            // Send icon SVG in input field
            <svg viewBox='0 0 20 20' className={styles.svgicon} xmlns='http://www.w3.org/2000/svg'>
            <path d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z'></path>
          </svg>}
            </button>
            </form>
            </div>
            <div className = {styles.footer}>
            <p>Built By Moko.</p> 
            </div>
        </div>
      </main>
    </>
  )
}

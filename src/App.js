import React from 'react'
import { useCallback, useState, useRef } from 'react'
import { 
    Container,
    Card,
    CardHeader,
    CardContent,
    CardActions,
    Button,
    TextField,
    CircularProgress
} from "@mui/material"

import {
    Send
} from '@mui/icons-material'
import Header from './Header.js'
import './App.css'
const Chat = () => {
    const [socket,setSocket] = useState(null)
    const [chatInitialized,setChatInitialized] = useState(false)
    const [chatMessage,setChatMessage] = useState("")
    const chatMessagesContainer = useRef()
    const [loading,setLoading] = useState(false)
    const [username,setUsername] = useState('')

    /*
        Get the socket URL for the pubsub channel
    */
    const getSocketUrl = useCallback(async ()=>{
        try{
            // Send a request to the backend to get the pubsub channel websocket url
            const request = await fetch(window.hostname + "/chatendpoint",{
                method: "POST",
                headers : {
                    "Content-Type" : "application/json"
                }
            })

            // Get the response after sending the request to the backen
            
            // Return the response from the backend
            // const data = new TextDecoder().decode(await request.body.getReader().read().value)
            const response = await request.json()
            return response

        }catch(err){
            // Log the error out to the console
            console.error(err)
        }
    },[])

    /*
        Initialize the chat once the user clicks chat button
    */
    const initializeChat = async () => {
        // Show the loader
        setLoading(true)

        // Get the socket url from the backend
        const socketUrlRequest = await getSocketUrl()

        // Host
        const h = window.location.hostname === "localhost" ? "yz3dacrr0.g.tau.link" : window.location.host

        // Append the host url to the returned socket url path
        const newWsUrl = `ws://${h}/${socketUrlRequest.socket}`

        // Generate a socket using the url
        const socket = getWebSocketInstance(newWsUrl)

        // Save the socket in the state
        setSocket(socket)

        // Set the chat initialized
        setChatInitialized(true)

        // Hide the loader
        setLoading(false)
    }

    /*
        Send a message through the websocket connection
    */
    const sendMessage = async () => {
        // Try to send the message
        try{
            // If the socket is not null
            if(socket != null){
                const data = {
                    sender : username,
                    msg : chatMessage,
                    timestamp : new Date().getTime().toString()
                }

                await socket.send(JSON.stringify(data))

                //Clear the outgoing chat message
                setChatMessage("")

            }
        // Catch the error
        }catch(err){
            // Log the error
            console.error(err)
        }
    }  

    const onEnterPressed = async (e) => {
        const enterPressed = e.key === 'Enter'
        if(enterPressed){
           await sendMessage()
        }
    }

    /*
        Generate and return a web socket with it's respective event handlers that connects
        to the given wsUrl
    */
    const getWebSocketInstance = (wsUrl) => {
        // Create a new WebSocket instance using the provoded web socket url
        const websocket = new WebSocket(wsUrl)

        // // Create an event handler for the open event on the WebSocket instance.
        // websocket.onopen = (socket,event) => {
        //     console.log("Web Socket Obtained:")
        //     console.log(socket)

        //     console.log("Web Socket Opened:")
        //     console.log(event)
        // }

        // // Create an event handler for when the web socket closes
        // websocket.onclose = (event) => {
        //     console.log("Web Socket Closed:")
        //     console.log(event)
        // }

        const generateMessageItem = (message) => {
          console.log(username)
            const msg = JSON.parse(message)
            const msgItem = document.createElement("div")
            msgItem.classList.add(msg.sender == username ? "outgoing-message-item" : "incoming-message-item")
            msgItem.innerText = `${msg.sender + " - " + msg.msg}`
            chatMessagesContainer.current.appendChild(msgItem)
            msgItem.scrollIntoView()
            // chatMessagesContainer.current.scrollTop = chatMessagesContainer.current.scrollHeight

        }
        
        // Create an event handler for when messages are received through the web socket
        websocket.onmessage = async (event) => {
            console.log("WebSocket Message Received:")
            const reader = new FileReader()
            reader.onload = () => {
                generateMessageItem(reader.result)
                // setMessages([...messages, JSON.parse(reader.result)])
            }

            reader.readAsText(event.data)         

        }

        // Create an event handler for when an error occurs with the web socket
        websocket.onerror = (event) => {
            console.log("Error found in WebSocket connection.")
            console.error(event)
        }

        // Return the websocket
        return websocket  
    }



    /*
        Render the chat view
    */
    return <div className="chat">
        <Header/>

        {/* Loader UI */}
        {loading && <Container style={{position: 'relative', top: 85}}>
            Loading Chat...
            <br/><br/>
            <CircularProgress/>
        </Container>}
        
        {/* Lobby UI */}
        {!chatInitialized && !loading && <Container style={{position: 'relative', top: 85}}>
            <Card>
                <CardHeader title="Lobby"/>
                <CardContent>
                    <TextField 
                      fullWidth 
                      label="Username" 
                      placeholder="Username" 
                      value={username} 
                      onChange={e=>setUsername(e.target.value)}
                    />             
                </CardContent>
                <CardActions style={{
                    display: 'flex', 
                    justifyContent : 'center'
                  }}>
                    <Button onClick={initializeChat}>
                        Join Chat
                    </Button>
                </CardActions>
            </Card>
        </Container>}

        {/* Chat UI */}
        {chatInitialized && !loading && <div 
          style={{position: 'relative', top: 8, margin: 8}}>
            <div 
              style={{
                height: '76vh', 
                background: 'whitesmoke', 
                borderRadius: 20, 
                padding: 10}} 
                className="chat_messages" 
                ref={chatMessagesContainer}>
                {/* This div will hold the chat messages */}
            </div>
            <div 
              style={{
                  position: 'fixed', 
                  width: '100vw', 
                  bottom : 20, 
                  display: 'grid',
                  gridTemplateColumns: '3fr 1fr', 
                  padding: 9}}
              >
                <TextField 
                  onKeyDown={onEnterPressed} 
                  placeholder="Message" 
                  // rows={8} 
                  // minRows={8} 
                  value={chatMessage} 
                  onChange={e=>setChatMessage(e.target.value)}
                />
                <Button 
                  onClick={e=>sendMessage()}>
                    <Send/>
                </Button>
            </div>
        </div>}
    </div>
}

export default Chat
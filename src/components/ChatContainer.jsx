import React, { useState, useEffect, useRef } from 'react'
import styled from "styled-components"
import ChatInput from './ChatInput';
import Logout from './Logout';
import axios from "axios";
import { Avatar, Comment } from 'antd';
import { getAllMessagesRoute, sendMessageRoute, getOneMessagesRoute, getAllMessagesgGroupRoute, sendMessageGroupRoute } from '../utils/APIRoutes'
import { v4 as uuidv4 } from "uuid";

export default function ChatContainer({ currentChat, currentUser, socket }) {
  const [messages, setMessages] = useState([]);
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const scrollRef = useRef();
  useEffect(() => {

    const fetchData = async () => {
      if (currentChat) {
        if (currentChat.nameGroup) {
          const response = await axios.post(getAllMessagesgGroupRoute, {
            groupId: currentChat._id,
          });
          setMessages(response.data);
        }
        else {
          const response = await axios.post(getAllMessagesRoute, {
            from: currentUser._id,
            to: currentChat._id,
          });
          setMessages(response.data);
        }
      }
    }

    fetchData();
  }, [currentChat]);

  const handleSendMsg = async (msg) => {
    if (currentChat?.username) {
     
      await axios.post(sendMessageRoute, {
        from: currentUser._id,
        to: currentChat._id,
        message: msg,
      });
      socket.current.emit("send-msg", {
        to: currentChat._id,
        from: currentUser._id,
        message: msg,
      });

      const msgs = [...messages];
      msgs.push({
        fromSelf: true,
        message: {
          text: msg
        },
      });
      
      setMessages(msgs);
    }
    if(currentChat?.nameGroup && typeof currentChat !== 'undefined') {
      
      await axios.post(sendMessageGroupRoute, {
        message: msg,
        group: {
          _id: currentChat._id
        },
        from: {
          _id: currentUser._id
        }
      });


      var mess = {};
    mess.message = {
      text: msg
    }
    mess.group = currentChat._id;
    mess.sender = {
      username: currentUser.username,
      avatarImage: currentUser.avatarImage
    }
    mess.to = currentChat._id;
    mess.from = currentUser._id;

    socket.current.emit("send-msg-group", mess);
    console.log(mess);
    const msgs = [...messages];
    msgs.push(mess);
    setMessages(msgs);
    }
    

  };

  useEffect(() => {
    if (socket.current) {
      socket.current.on("msg-recieved", async (msg) => {
        setArrivalMessage({
          to: msg.to,
          from: msg.from,
          fromSelf: false,
          message: {
            text: msg.message
          },
        })
      })

      socket.current.on("msg-group-revieced", (msg) => {
        setArrivalMessage(msg);
      })
    }

    return () => {

    }

  }, []);


  useEffect(() => {
    if (currentChat?.username) {
      (arrivalMessage && (currentUser._id === arrivalMessage.to && currentChat._id === arrivalMessage.from)) && setMessages((prev) => [...prev, arrivalMessage]);
    }
    if (currentChat?.nameGroup) {
     
      (arrivalMessage && (currentUser._id !== arrivalMessage.from && currentChat._id === arrivalMessage.group)) && setMessages((prev) => [...prev, arrivalMessage]);
    }

  }, [arrivalMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      {
        currentChat?.username ? (
          <Container>
            <div className="chat-header">
              <div className="user-details">
                <div className="avatar">
                  <img
                    src={`data:image/svg+xml;base64,${currentChat?.avatarImage}`}
                    alt="avatar" />
                </div>
                <div className="username">
                  <h3>{currentChat?.username}</h3>
                </div>
              </div>
              <Logout />
            </div>
            <div className="chat-messages">
              {messages.map((message) => {
                return (
                  <div ref={scrollRef} key={uuidv4()}>
                    <div
                      className={`message ${message.fromSelf ?
                        "sended" :
                        "recieved"
                        }`}
                    >
                      <div className="content">
                        <Comment
                          author={<label style={{ color: 'green', fontSize: '30px' }}>{message.fromSelf ? currentUser.username : currentChat?.username}</label>}
                          avatar={<Avatar src={`data:image/svg+xml;base64,${message.fromSelf ? currentUser.avatarImage : currentChat?.avatarImage}`} alt={message.fromSelf ? currentUser.username : currentChat?.username} />}
                          content={
                            <label style={{ color: 'red', fontSize: '20px' }}>{message?.message.text}</label>
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <ChatInput handleSendMsg={handleSendMsg} />
          </Container>
        ) : (
          <Container>
            <div className="chat-header">
              <div className="user-details">
                <div className="avatar">
                  <img
                    src={`data:image/svg+xml;base64,${currentChat?.avatarImage}`}
                    alt="avatar" />
                </div>
                <div className="username">
                  <h3>{currentChat?.nameGroup}</h3>
                </div>
              </div>
              <Logout />
            </div>
            <div className="chat-messages">
              {messages.map((message) => {
                return (
                  <div ref={scrollRef} key={uuidv4()}>
                    <div
                      className={`message ${message?.sender?.username === currentUser.username ?
                        "sended" :
                        "recieved"
                        }`}
                    >
                      <div className="content">
                        <Comment
                          author={<label style={{ color: 'green', fontSize: '30px' }}>{message?.sender?.username}</label>}
                          avatar={<Avatar src={`data:image/svg+xml;base64,${message?.sender?.avatarImage}`} alt={message?.sender?.avatarImage} />}
                          content={
                            <label style={{ color: 'red', fontSize: '30px' }}>{message?.message?.text}</label>
                          }

                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <ChatInput handleSendMsg={handleSendMsg} />
          </Container>
        )
      }
    </>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 80% 10%;
  gap: 0.1rem;
  overflow: hidden;
  @media screen and (min-width: 720px) and (max-width: 1080px) {
    grid-template-rows: 15% 70% 15%;
  }
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    .user-details {
      display: flex;
      align-items: center;
      gap: 1rem;
      .avatar {
        img {
          height: 3rem;
        }
      }
      .username {
        h3 {
          color: white;
          text-transform: capitalize;
        }
      }
    }
  }
  .chat-messages {
    padding: 1rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: auto;
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    .message {
      display: flex;
      align-items: center;
      .content {
        max-width: 40%;
        overflow-wrap: break-word;
        padding: 1rem;
        font-size: 1.1rem;
        border-radius: 1rem;
        color: #d1d1d1;
        @media screen and (min-width: 720px) and (max-width: 1080px) {
          max-width: 70%;
        }
      }
    }
    .sended {
      justify-content: flex-end;
      .content {
        background-color: #FFFF99;
      }
    }
    .recieved {
      justify-content: flex-start;
      .content {
        background-color: #FF99FF;
      }
    }
  }
`;
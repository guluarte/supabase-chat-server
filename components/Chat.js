/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from 'react'

const Chat = ({ currentUser, session, supabase }) => {
  //   console.log(supabase)

  const [messages, setMessages] = useState([])
  const message = useRef('')
  const newUsername = useRef('')
  const [editingUsername, setEditingUsername] = useState(false)
  const [users, setUsers] = useState([])

  useEffect(async () => {
    const user = supabase
      .from('user')
      .on('UPDATE', payload => {
        console.log('Change received!', payload)
      })
      .subscribe()

    const setupUsersSubscription = async () => {
      console.log('test')

      await supabase
        .from('user')
        .on('UPDATE', payload => {
          console.log('Change received!', payload)

          console.log(payload)
          setUsers(users => {
            console.log(users)
            const user = users[payload.new.id]
            console.log('user', user)
            if (user) {
              return Object.assign({}, users, {
                [payload.new.id]: payload.new
              })
            } else {
              return users
            }
          })
        })
        .subscribe()
    }
    await setupUsersSubscription()
  }, [])

  useEffect(async () => {
    const getMessages = async () => {
      let { data: messages, error } = await supabase.from('message').select('*')

      //   console.log(messages)

      setMessages(messages)
    }

    const setupMessagesSubcription = async () => {
      await supabase
        .from('message')
        .on('INSERT', payload => {
          setMessages(previous => [].concat(previous, payload.new))
        })
        .subscribe()
    }

    getMessages()
    setupMessagesSubcription()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getUsersFromSupabase = async (users, usersIds) => {
    const usersToGet = Array.from(usersIds).filter(userId => !users[userId])
    if (Object.keys(users).length && usersToGet.length === 0) {
      return users
    }

    const { data } = await supabase
      .from('user')
      .select('id,username')
      .in('id', usersToGet)

    const newUsers = {}
    data.forEach(user => (newUsers[user.id] = user))
    return Object.assign({}, users, newUsers)
  }

  useEffect(() => {
    const getUsers = async () => {
      const usersIds = new Set(messages.map(message => message.user_id))
      const newUsers = await getUsersFromSupabase(users, usersIds)
      setUsers(newUsers)
    }
    getUsers()
  }, [messages])

  if (!currentUser) {
    return null
  }

  const sendMessage = async evt => {
    evt.preventDefault()
    const content = message.current.value

    await supabase
      .from('message')
      .insert([{ content, user_id: session.user.id }])

    message.current.value = ''
  }

  const logout = evt => {
    evt.preventDefault()
    window.localStorage.clear()
    window.location.reload()
  }

  const setUsername = async evt => {
    evt.preventDefault()
    const username = newUsername.current.value

    await supabase.from('user').insert(
      [
        {
          ...currentUser,
          username
        }
      ],
      { upsert: true }
    )

    newUsername.current.value = ''
    setEditingUsername(false)
  }

  const username = user_id => {
    const user = users[user_id]
    if (!user) {
      return ''
    }
    return user.username ? user.username : user.id
  }

  return (
    <div>
      <p>
        Welcome,{' '}
        {currentUser.username ? currentUser.username : session.user.email}
      </p>
      <div>
        {editingUsername ? (
          <form onSubmit={setUsername}>
            <input
              placeholder='New username'
              required
              ref={newUsername}
            ></input>
            <button type='submit'>Update username</button>
          </form>
        ) : (
          <div>
            <button onClick={() => setEditingUsername(true)}>
              Edit username
            </button>
            <button onClick={logout}>Log out</button>
          </div>
        )}
      </div>
      {messages.map(message => (
        <div key={message.id}>
          <span>{username(message.user_id)}:</span>
          <div>{message.content}</div>
        </div>
      ))}

      <form onSubmit={sendMessage}>
        <input placeholder='Write your message' required ref={message}></input>
        <button type='submit'>Send message</button>
      </form>
    </div>
  )
}

export default Chat

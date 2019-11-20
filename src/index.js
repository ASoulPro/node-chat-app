const path = require('path')
const Filter = require('bad-words')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const { generateMessage, generateLocationMessage } = require('./utils/messages.js')
const {addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)


const port = process.env.PORT || 3003
const publicDirectoryPath = path.join(__dirname, '../public') //Review web server project(weather)

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('connected')


    socket.on('join', ({username, room}, callback) => {
        const {error, user} = addUser({id: socket.id, username, room})

        if(error) {
            return callback(error)
        }

        socket.join(user.room)
        
        socket.emit('Message', generateMessage('Admin','Welcome to the Chat !'))
        socket.broadcast.to(user.room).emit('Message', generateMessage('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()

    })

    socket.on('sendMessage', (text, callback) => {
        const filter = new Filter()
    
        const user = getUser(socket.id)

        io.to(user.room).emit('Message',generateMessage(user.username, filter.clean(text)))
        callback('Delevered!')
    })
    
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('Message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })
    socket.on('sendLocation', (location, callback) => {

        const user = getUser(socket.id)


        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${location.lat},${location.long}`))
        callback()
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})  
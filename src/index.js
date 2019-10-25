const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')

const {generateMessage,generateLocationMessage} = require('../src/utils/messages')

const {addUser,getUser,getUserInRoom,removeUser} = require('./utils/users')


const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000


const publicDirectoryPath = path.join(__dirname,'../public')
app.use(express.static(publicDirectoryPath))

app.set('view engine','html')

// app.get('/',(req,res)=>{
//     res.render(index)
// })

//let count = 0


io.on('connection',(socket)=>{
    console.log('New Web Socket')

    //New user joined
    socket.on('join',(data,callback)=>{

        const {error,user} = addUser({id: socket.id , username: data.username, room : data.room})

        if(error){
            return callback(error)
            
        }

        socket.join(user.room)

        socket.emit('message',generateMessage('Welcome!','Admin'))
        socket.broadcast.to(user.room).emit('message',generateMessage(`${user.username} has joined.`,'Admin'))

        io.to(user.room).emit('roomData',{
            room : user.room,
            users: getUserInRoom(user.room)
        })

        callback()

    })


    socket.on('sendMessage',(data,callback)=>{

        const filter = new Filter()

        if(filter.isProfane(data)){
            return callback('Profanity not allowed')
        }

        const user = getUser(socket.id)

        if(!user){
            return callback('User error')
        }


        io.to(user.room).emit('message',generateMessage(data,user.username))
        callback()
    })

    socket.on('sendLocation',(loc,callback)=>{

        const user = getUser(socket.id)


        io.to(user.room).emit('locationMessage',generateLocationMessage(`https://google.com/maps?q=${loc.lat},${loc.long}`,user.username))
        callback('Location Shared')
    })


    

    socket.on('disconnect',()=>{

        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', generateMessage(`${user.username} left.`,'Admin'))
            io.to(user.room).emit('roomData',{
                room : user.room,
                users: getUserInRoom(user.room)
            })
        }

        
    })
})


server.listen(port,()=>{
    console.log('Hello From Server')
})


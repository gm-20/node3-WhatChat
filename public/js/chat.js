const socket = io()



//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')


//Fetching query value from browser
const {username,room} = Qs.parse(location.search,{ignoreQueryPrefix: true})

const autoscroll = ()=>{
    
    //New message
    const $newMessage = $messages.lastElementChild
    
    //Height of New Message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible height
    const visibleHeight = $messages.offsetHeight

    //Height of Message Container
    const containerHeight = $messages.scrollHeight


    //How far scrolled ??
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <=scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
    

}


//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

socket.on('message',(msg)=>{
    console.log(msg)
    const html = Mustache.render(messageTemplate,{
        user : msg.username,
        message : msg.text,
        time : moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage',(data)=>{
    console.log(data)
    const html = Mustache.render(locationTemplate,{
        user: data.username,
        url : data.url,
        time : moment(data.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({room,users}) => {
    console.log(room)
    console.log(users)
    const html = Mustache.render(sidebarTemplate,{
        room : room,
        users: users
    })

    document.querySelector('#sidebar').innerHTML = html 

})



$messageForm.addEventListener('submit',(e)=>{

    e.preventDefault()

    $messageFormButton.setAttribute('disabled','disabled')
    //disable 

    const data = $messageFormInput.value
    socket.emit('sendMessage',data,(callback_data)=>{
        //enable
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        console.log('Message is delivered')
    })

})

$locationButton.addEventListener('click',()=>{

    //disable
    $locationButton.setAttribute('disabled','disabled')

    if(!navigator.geolocation){
        return alert('Geolocation not supported in browser') 
    }

    navigator.geolocation.getCurrentPosition((pos)=>{
        const loc = {
            lat: pos.coords.latitude,
            long: pos.coords.longitude
        }
        //console.log(loc)

        socket.emit('sendLocation',loc,(callback_data)=>{

            //enable
            $locationButton.removeAttribute('disabled')
            console.log(callback_data)
        })


    })

})


socket.emit('join',{username,room},(error) => {

    if(error){
            alert (error)
            location.href = '/'
    }

})
const socket = io()

const $messageForm = document.querySelector('#submited')
const $messgeFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

const messageTemplete = document.querySelector('#message-templete').innerHTML
const locationTemplete = document.querySelector('#location-templete').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoScroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild
   
    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = Math.ceil($messages.scrollTop + visibleHeight)

    if (containerHeight - newMessageHeight <= scrollOffset) {
        console.log('hi')
        $messages.scrollTop = $messages.scrollHeight
    }


    // OR simply :)
    // const element=$messages.lastElementChild
    // element.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest"})
}

socket.on('Message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplete, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationTemplete, {
        username: message.username,
        URL: message.URL,
        createdAt: moment(message.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()

})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html
})
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')
    const text = e.target.elements.msg.value

   socket.emit('sendMessage', text, (msg) => {
    $messageFormButton.removeAttribute('disabled')
    $messgeFormInput.value = ''
    $messgeFormInput.focus()

       console.log(msg)
   })

})


$locationButton.addEventListener('click', () => {
    if(!navigator.geolocation){
    return alert('Location is not supported by your broweser. Please update the latest version')
    }

    $locationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
      
        socket.emit('sendLocation',{
            long: position.coords.longitude,
            lat: position.coords.latitude
        }, () => {
            $locationButton.removeAttribute('disabled')
            console.log('Location Shared')
        })
    })

})

socket.emit('join' , {username, room}, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})

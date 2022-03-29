const body = document.querySelector("body")
const connecting_screen = document.querySelector("#connecting-screen")
const message_input = document.querySelector("#message-input")
const room_id_display = document.querySelector("#room-id-display")
const messages_container = document.querySelector("#messages-container")
const message_box_container = document.querySelector("#message-box-container")
const end_room_button = document.querySelector("#end-room-button")
const message_sent_audio = document.querySelector("#message-sent-audio")
const typing_container = document.querySelector("#typing-container")
const message_received_audio = document.querySelector("#message-received-audio")
const message_user_joined_audio = document.querySelector("#message-user-joined-audio")
const message_user_left_audio = document.querySelector("#message-user-left-audio")
const message_room_ended_audio = document.querySelector("#message-room-ended-audio")
const room_id = document.querySelector("#room-id").innerHTML.toString().trim()
var user_name = document.querySelector("#user-name").innerHTML.toString().trim()
const server = location.protocol + '//' + location.host + "/"
var room_ended = false
var typing_info = {
    member: "",
    member_id: "",
    time: 0
}
var socket = null

// Verify username
while (user_name == "" || user_name == null || user_name == undefined)
{
    user_name_temp = prompt("Enter your name: ")

    if (user_name_temp != null && user_name_temp != undefined)
    {
        user_name = user_name_temp.toString().trim()
    }
}

// Listeners
body.onload = () => {
    document.title = "Connecting..."

    ConnectToServer()

    RequestInterval()
}
end_room_button.onclick = () => {
    let answer = confirm("Confirm you want to end this MeetUp now?")

    if (answer)
    {
        EndRoom()
    }
}
message_input.onkeypress = (e) => {
    if (e.keyCode == 13)
    {
        let message = message_input.value.toString().trim()

        if (message != "")
        {
            SendMessage(message)
        }

        message_input.value = ""
    }
    else
    {
        SendTyping()
    }
}

// Functions
function ToggleConnectingScreen(value)
{
    if (value)
    {
        connecting_screen.style.visibility = "visible"
    }
    else
    {
        connecting_screen.style.visibility = "hidden"
    }
}

function SendTyping()
{
    if (connected())
    {
        socket.emit("typing")
    }
}

function ConnectToServer()
{
    ToggleConnectingScreen(true)

    socket = io(server + "active_room", {
        reconnection: false,
        query: {
            user_name: user_name,
            room_id: room_id
        }
    })

    socket.on("connect", () => {
        if (!room_ended)
        {
            document.title = room_id + " - Connected"
            room_id_display.innerHTML = room_id
            ToggleConnectingScreen(false)

            message_input.value = ""
            message_input.focus()
        }
    })

    socket.on("connect_error", (err) => {
        if (!room_ended)
        {
            message_input.blur()
            message_input.value = ""

            var error = err.toString().trim()
            error = error.substring(7, error.length)
            let error_message = "Something went wrong!"

            if (isCEFS(error))
            {
                error_message = error.substring(2, error.length).trim()
            }

            DisconnectFromServer(socket)
            alert(error_message)
            ConnectToServer()
        }
    })

    socket.on("disconnect", () => {
        if (!room_ended)
        {
            message_input.blur()
            message_input.value = ""

            DisconnectFromServer(socket)
            alert("You were disconnected from the server.")
            ConnectToServer()
        }
    })

    socket.on("receive_message", (object) => {
        if (!room_ended)
        {
            let sender_name = object.sender.name.toString()
            let message = object.message.toString()
            let sender_id = object.sender.id.toString()

            if (connected())
            {
                let my_id = socket.id

                if (my_id != null)
                {
                    if (sender_id == my_id)
                    {
                        // Sent by me
                        AddMessage(0, {
                            message: message
                        })
                    }
                    else
                    {
                        // Sent by someone else
                        AddMessage(1, {
                            sender_name: sender_name,
                            message: message
                        })
                    }
                }
            }
        }
    })

    socket.on("user_joined", data => {
        if (!room_ended)
        {
            let other_user_name = data.toString().trim()

            AddMessage(2, {
                other_user_name: other_user_name
            })
        }
    })

    socket.on("user_left", data => {
        if (!room_ended)
        {
            let other_user_name = data.toString().trim()
        
            AddMessage(3, {
                other_user_name: other_user_name
            })
        }
    })

    socket.on("room_ended", other_user_name_temp => {
        if (!room_ended)
        {
            room_ended = true
            DisconnectFromServer(socket)
            socket = null
            document.title = room_id + " - Ended"
            let other_user_name = other_user_name_temp.toString()

            message_input.blur()
            message_input.disabled = true
            message_box_container.style.visibility = "hidden"
            end_room_button.style.visibility = "hidden"
            AddMessage(4, {
                other_user_name: other_user_name
            })
        }
    })
    
    socket.on("typing_info", object => {
        let member = object.member
        let member_id = object.member_id
        let time = object.time

        typing_info = {
            member: member,
            member_id: member_id,
            time: time
        }
    })
}

function AddMessage(id, object)
{
    var toAdd = document.createElement("span")

    if (id == 0)
    {
        // Sent by me
        let message = object.message

        let div = document.createElement("div")
        div.classList.add("message-sent")

        let box = document.createElement("div")
        box.classList.add("box")

        let message_e = document.createElement("div")
        message_e.classList.add("message")
        message_e.innerText = message

        box.appendChild(message_e)
        div.appendChild(box)

        toAdd = div
    }
    else if (id == 1)
    {
        // Sent by other user
        let message = object.message
        let sender_name = object.sender_name

        let div = document.createElement("div")
        div.classList.add("message-received")

        let img = document.createElement("img")
        img.src = "/public/ui.png"

        let box = document.createElement("div")
        box.classList.add("box")

        let message_e = document.createElement("div")
        message_e.classList.add("message")
        message_e.innerText = message

        let sn_e = document.createElement("div")
        sn_e.classList.add("sender-name")
        sn_e.innerText = sender_name

        box.appendChild(sn_e)
        box.appendChild(message_e)
        div.appendChild(img)
        div.appendChild(box)

        toAdd = div
    }
    else if (id == 2)
    {
        // User joined
        let other_user_name = object.other_user_name

        let div = document.createElement("div")
        div.classList.add("info-message")

        let center = document.createElement("center")
        let hr1 = document.createElement("hr")
        let hr2 = document.createElement("hr")
        
        hr1.color = "lightgray"
        hr2.color = "lightgray"

        let span = document.createElement("span")
        span.innerText = other_user_name + " joined"

        center.appendChild(hr1)
        center.appendChild(span)
        center.appendChild(hr2)
        div.appendChild(center)

        toAdd = div
    }
    else if (id == 3)
    {
        // User left
        let other_user_name = object.other_user_name

        let div = document.createElement("div")
        div.classList.add("info-message")

        let center = document.createElement("center")
        let hr1 = document.createElement("hr")
        let hr2 = document.createElement("hr")
        
        hr1.color = "lightgray"
        hr2.color = "lightgray"

        let span = document.createElement("span")
        span.innerText = other_user_name + " left"

        center.appendChild(hr1)
        center.appendChild(span)
        center.appendChild(hr2)
        div.appendChild(center)

        toAdd = div
    }
    else if (id == 4)
    {
        // Room ended
        let other_user_name = object.other_user_name

        let div = document.createElement("div")
        div.classList.add("info-message")

        let center = document.createElement("center")
        let hr1 = document.createElement("hr")
        let hr2 = document.createElement("hr")

        let span = document.createElement("span")
        span.style = "color: red"
        span.innerHTML = "MeetUp ended by <b>" + other_user_name + "</b>"

        center.appendChild(hr1)
        center.appendChild(span)
        center.appendChild(hr2)

        div.appendChild(center)

        toAdd = div
    }

    messages_container.appendChild(toAdd)

    // Make sound
    if (id == 0)
    {
        // Message sent
        message_sent_audio.currentTime = 0
        message_sent_audio.play()
    }
    else if (id == 1)
    {
        // Message received
        message_received_audio.currentTime = 0
        message_received_audio.play()
    }
    else if (id == 2)
    {
        // User joined
        message_user_joined_audio.currentTime = 0
        message_user_joined_audio.play()
    }
    else if (id == 3)
    {
        // User left
        message_user_left_audio.currentTime = 0
        message_user_left_audio.play()
    }
    else if (id == 4)
    {
        // Room ended
        message_room_ended_audio.currentTime = 0
        message_room_ended_audio.play()
    }

    // Scroll to bottom
    messages_container.scrollTop = messages_container.scrollHeight
}

function ToggleTyping(value)
{
    if (value)
    {
        typing_container.style.visibility = "visible"
    }
    else
    {
        typing_container.style.visibility = "collapse"
    }
}

function SetTyping(value)
{
    typing_container.innerText = value + " is typing..."
}

function DisconnectFromServer(socket)
{
    socket.removeAllListeners()

    if (connected())
    {
        socket.disconnect()
    }
}

function isCEFS(text)
{
    if (text.length > 2)
    {
        if (text.substring(0, 2) == "SS")
        {
            return true
        }
        else
        {
            return false
        }
    }
    else
    {
        return false
    }
}

function EndRoom()
{
    if (connected())
    {
        socket.emit("end_room")
    }
}

function SendMessage(message)
{
    if (connected())
    {
        socket.emit("message", message)
    }
}

function connected()
{
    return socket != null && socket.connected
}

function RequestInterval()
{
    setInterval(() => {
        $.get(server + "i")
    }, 300000)
}

// Typing Info
setInterval(() => {
    let member = typing_info.member
    let member_id = typing_info.member_id
    let time = typing_info.time

    if (member == "" || time == 0)
    {
        ToggleTyping(false)
    }
    else
    {
        let current_time = parseInt(Date.now().toString())

        if (current_time - time < 2000)
        {
            SetTyping(member)
            ToggleTyping(true)
        }
        else
        {
            ToggleTyping(false)
        }
    }
}, 0)
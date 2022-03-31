const name_input = document.querySelector("#name-input")
const body = document.querySelector("body")
const room_code_input = document.querySelector("#room-code-input")
const join_button = document.querySelector("#join-button")
const join_random_room_button = document.querySelector("#join-random-room-button")
const create_room_button = document.querySelector("#create-room-button")
const loading_screen = document.querySelector("#loading-screen")
const rooms_count = document.querySelector("#rooms_count")
const searching_rooms_screen = document.querySelector("#searching-rooms-screen")
const server = location.protocol + '//' + location.host + "/"
var socket = null
const ws_server = "ws://" + location.host + "/"

// Fetch name
name_input.value = fetch_name()

// Listeners
body.onload = () => {
    SocketConnect()
}
name_input.oninput = () => {
    set_name(name_input.value.toString())
}
name_input.onkeydown = (e) => {
    if (e.keyCode == 13)
    {
        room_code_input.focus()
    }
}
room_code_input.onkeydown = (e) => {
    if (e.keyCode == 13)
    {
        JoinRoom()
    }
}
join_button.onclick = () => JoinRoom()
create_room_button.onclick = () => window.open(server + "create", "_self")
join_random_room_button.onclick = () => JoinRandomRoom()

// Functions
function SocketConnect()
{
    socket = io(ws_server + "home", {
        reconnection: false
    })

    socket.on("connect_error", () => {
        rooms_count.innerText = "(0 active)"
        SocketConnect()
    })

    socket.on("disconnect", () => {
        SocketConnect()
    })

    socket.on("rooms_count", object => {
        let count = object.toString().trim()
        rooms_count.innerText = "(" + count + " active)"
    })
}
function fetch_name()
{
    if (localStorage.getItem("name") != null)
    {
        return localStorage.getItem("name")
    }
    else
    {
        return ""
    }
}

function JoinRandomRoom()
{
    toggleSearching(true)

    $.ajax({
        url: server + "random-room",
        type: "GET",
        success: (data) => {

            // Hide loading
            toggleSearching(false)

            if (data.success == true)
            {
                let room_id = data.roomId

                let user_name = name_input.value.toString().trim()

                if (user_name != "")
                {
                    JoinRoomFinal(room_id, user_name)
                }
                else
                {
                    JoinRoomFinal(room_id, null)
                }
            }
            else
            {
                let error_text = data.error

                if (error_text != undefined)
                {
                    alert(error_text)
                }
                else
                {
                    alert("Something went wrong!")
                }
            }
        },
        error: () => {
            // Hide searching
            toggleSearching(false)

            alert("Something went wrong!")
        }
    })
}

function set_name(text)
{
    localStorage.setItem("name", text)
}

function toggleSearching(value)
{
    if (value)
    {
        searching_rooms_screen.style.visibility = "visible"
    }
    else
    {
        searching_rooms_screen.style.visibility = "hidden"
    }
}

function JoinRoom()
{
    toggleLoading(true)

    let name = name_input.value.toString().trim()
    let code = room_code_input.value.toString().trim()

    if (name != "")
    {
        $.ajax({
            url: server + "room-status?id=" + code,
            type: "GET",
            success: (data) => {

                // Hide loading
                toggleLoading(false)

                if (data.success == true)
                {
                    let room_active = data.roomActive

                    if (room_active == true)
                    {
                        JoinRoomFinal(code, name)
                    }
                    else
                    {
                        alert("This MeetUp is not actively running.")
                    }
                }
                else
                {
                    let error_text = data.error

                    if (error_text != undefined)
                    {
                        alert(error_text)
                    }
                    else
                    {
                        alert("Something went wrong!")
                    }
                }
            },
            error: () => {
                // Hide loading
                toggleLoading(false)

                alert("Something went wrong!")
            }
        })
    }
    else
    {
        alert("Please enter your name before joining a MeetUp.")
    }
}

function toggleLoading(value)
{
    if (value)
    {
        loading_screen.style.visibility = "visible"
    }
    else
    {
        loading_screen.style.visibility = "hidden"
    }
}

function JoinRoomFinal(code, name)
{
    if (name != null)
    {
        window.open(server + "join/" + code + "?name=" + name, "_self")
    }
    else
    {
        window.open(server + "join/" + code, "_self")
    }
}
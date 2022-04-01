const name_input = document.querySelector("#name-input")
const body = document.querySelector("body")
const room_code_input = document.querySelector("#room-code-input")
const join_button = document.querySelector("#join-button")
const join_random_room_button = document.querySelector("#join-random-room-button")
const create_room_button = document.querySelector("#create-room-button")
const loading_screen = document.querySelector("#loading-screen")
const rooms_count = document.querySelector("#rooms_count")
const dialogs_container = document.querySelector("#dialogs-container")
const owner_name = document.querySelector("#owner-name")
const searching_rooms_screen = document.querySelector("#searching-rooms-screen")
const server = location.protocol + '//' + location.host + "/"
var socket = null
const ws_server = "ws://" + location.host + "/"
var dialog_top_index = 200

// Fetch name
name_input.value = fetch_name()

// Listeners
owner_name.onclick = () => {
    window.open("https://charmflex.vercel.app/", "_blank")
}
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
    rooms_count.innerText = "Waiting..."

    socket = io(ws_server + "home", {
        reconnection: false
    })

    socket.on("connect_error", () => {
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

function MakeDialog(text)
{
    dialog_top_index += 1

    let dialog = document.createElement("div")
    dialog.classList.add("dialog")

    let canvas = document.createElement("canvas")
    canvas.style.zIndex = dialog_top_index
    canvas.onclick = () => {
        dialog.remove()
    }

    let container = document.createElement("div")
    container.classList.add("container")
    container.style.zIndex = dialog_top_index + 1

    let b = document.createElement("b")
    b.innerText = "Information"

    let br1 = document.createElement("br")
    
    let span = document.createElement("span")
    span.innerText = text.toString().trim()

    let br2 = document.createElement("br")
    let br3 = document.createElement("br")

    let second = document.createElement("div")
    second.classList.add("second")

    let button = document.createElement("button")
    button.innerText = "Close"
    button.onclick = () => {
        dialog.remove()
    }

    // Position elements
    second.appendChild(button)
    container.appendChild(b)
    container.appendChild(br1)
    container.appendChild(span)
    container.appendChild(br2)
    container.appendChild(br3)
    container.appendChild(second)
    dialog.appendChild(canvas)
    dialog.appendChild(container)

    dialogs_container.appendChild(dialog)
    button.focus()
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
                    MakeDialog(error_text)
                }
                else
                {
                    MakeDialog("Something went wrong!")
                }
            }
        },
        error: () => {
            // Hide searching
            toggleSearching(false)

            MakeDialog("Something went wrong!")
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
                        MakeDialog("This MeetUp is not actively running.")
                    }
                }
                else
                {
                    let error_text = data.error

                    if (error_text != undefined)
                    {
                        MakeDialog(error_text)
                    }
                    else
                    {
                        MakeDialog("Something went wrong!")
                    }
                }
            },
            error: () => {
                // Hide loading
                toggleLoading(false)

                MakeDialog("Something went wrong!")
            }
        })
    }
    else
    {
        // Hide loading
        toggleLoading(false)

        MakeDialog("Please enter your name before joining a MeetUp.")
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
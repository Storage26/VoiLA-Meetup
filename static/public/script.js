const name_input = document.querySelector("#name-input")
const room_code_input = document.querySelector("#room-code-input")
const join_button = document.querySelector("#join-button")
const create_room_button = document.querySelector("#create-room-button")
const loading_screen = document.querySelector("#loading-screen")
const server = location.protocol + '//' + location.host + "/"

// Fetch name
name_input.value = fetch_name()

// Listeners
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

// Functions
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

function set_name(text)
{
    localStorage.setItem("name", text)
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
    window.open(server + "join/" + code + "?name=" + name, "_self")
}
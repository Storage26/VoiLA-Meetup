const body = document.querySelector("body")
const user_name = document.querySelector("#user-name")
const create_button = document.querySelector("#create-button")
const loading_screen = document.querySelector("#loading-screen")
const server = window.location

// Listeners
body.onload = () => {
    user_name.focus()
}
create_button.onclick = () => {
    CreateRoom()
}
user_name.onkeypress = (e) => {
    if (e.keyCode == 13)
    {
        CreateRoom()
    }
}

function CreateRoom()
{
    toggleLoading(true)

    let name = user_name.value.toString().trim()

    $.ajax({
        url: server + "/create-room?name=" + name,
        type: "GET",
        success: (data) => {
            // Hide loading
            toggleLoading(false)

            if (data.success)
            {
                let code = data.roomCode
                JoinRoom(code, name)
            }
            else
            {
                let error = data.error

                alert(error)

                user_name.focus()
            }
        },
        error: () => {
            // Hide loading
            toggleLoading(false)

            alert("Something went wrong!")
        }
    })
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

function JoinRoom(code, name)
{
    window.open(server + "/join/" + code + "?name=" + name, "_self")
}
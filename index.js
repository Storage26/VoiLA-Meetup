const express = require("express")
const socketio = require("socket.io")
const http = require("http")
const cors = require("cors")
const admin = require("firebase-admin")
const fs = require("fs")
const app = express()
const server = http.createServer(app)
const io = socketio(server, { cors: { origin: "*" } })
const PORT = process.env.PORT || 8000

{
    admin.initializeApp({
        credential: admin.credential.cert("./static/credential.json"),
        databaseURL: "https://voila-26-default-rtdb.asia-southeast1.firebasedatabase.app/"
    })
}

const database = admin.database()

app.use(cors({
    origin: "*",
    credentials: true,
    optionsSuccessStatus: 200
}))
app.use("/public", express.static("static/public"))

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html")
})

app.get("/create", (req, res) => {
    res.sendFile(__dirname + "/create-room.html")
})

app.get("/random-room", (req, res) => {
    database.ref("ActiveRooms").get().then(snap => {
        
        if (snap.numChildren() > 0)
        {
            // Rooms exist
            let list = []

            // Add to list
            snap.forEach(snap1 => {
                list.push(snap1.key)
            })

            let min = 0
            let max = list.length - 1
            let num = Math.floor(Math.random() * (max - min + 1) + min)

            res.json({
                success: true,
                roomId: list[num]
            })
        }
        else
        {
            res.json({
                success: false,
                error: "No MeetUps are running actively. But, you can make your own!"
            })
        }

    }).catch(() => {
        res.json({
            success: false,
            error: "It seems our server is currently down."
        })
    })
})

app.get("/i", (req, res) => {
    res.end()
})

app.get("/join/:code", (req, res) => {
    let code = req.params.code
    let user_name = req.query.name

    if (given(code))
    {
        database.ref("ActiveRooms").get().then(snap1 => {
            
            if (snap1.hasChild(code))
            {
                if (given(user_name))
                {
                    res.send(fs.readFileSync("./static/public/active-room/index.html").toString().trim().replace("$$$ROOM-ID$$$", code).replace("$$$USER-NAME$$$", user_name))
                }
                else
                {
                    res.send(fs.readFileSync("./static/public/active-room/index.html").toString().trim().replace("$$$ROOM-ID$$$", code).replace("$$$USER-NAME$$$", ""))
                }
            }
            else
            {
                let error = "This MeetUp is not actively running."
                res.send(fs.readFileSync("./info.html").toString().trim().replace("$$$TEXT$$$", error))
            }

        }).catch(() => {
            let error = "It seems our server is currently down."
            res.send(fs.readFileSync("./info.html").toString().trim().replace("$$$TEXT$$$", error))
        })
    }
    else
    {
        let error = "No MeetUp Code provided."
        res.send(fs.readFileSync("./info.html").toString().trim().replace("$$$TEXT$$$", error))
    }
})

app.get("/create-room", (req, res) => {

    let username = req.query.name

    if (given(username)) {
        database.ref("ActiveRooms").get().then(snap => {
            
            var code = RandomCode()

            while (true)
            {
                if (snap.hasChild(code))
                {
                    code = RandomCode()
                }
                else
                {
                    break
                }
            }

            database.ref("ActiveRooms/" + code + "/Active").set(true).then(() => {
                res.json({
                    success: true,
                    roomCode: code
                })
            }).catch(() => {
                res.json({
                    success: false,
                    error: "It seems our server is currently down."
                })
            })

        }).catch(() => {
            res.json({
                success: false,
                error: "It seems our server is currently down."
            })
        })
    }
    else {
        res.json({
            success: false,
            error: "Please enter your name to create a MeetUp"
        })
    }

})

app.get("/room-status", (req, res) => {
    var id = req.query.id

    if (given(id)) {
        id = id.toString().trim()

        database.ref("ActiveRooms/" + id).get().then(snap1 => {

            res.json({
                success: true,
                roomActive: snap1.hasChild("Active")
            })

        }).catch(() => {
            res.json({
                success: false,
                error: "It seems our server is currently down."
            })
        })
    }
    else {
        res.json({
            success: false,
            error: "Please enter a valid MeetUp Code."
        })
    }
})

app.get("*", (req, res) => {
    res.sendFile(__dirname + "/not_found.html")
})

server.listen(PORT, () => { console.log(`Listening for requests on port ${PORT}`) })

// Functions
function given(text) {
    if (text != undefined && text != null) {
        let text_now = text.toString().trim()

        return text_now != ""
    }
    else {
        return false
    }
}

function RandomCode() {
    let mix = fs.readFileSync("./mix.txt").toString().trim().split("\n")
    let code = ""
    let length = 4
    let min = 0
    let max = mix.length - 1

    for (i = 0; i < length; i++) {
        let current = mix[Math.floor(Math.random() * (max - min + 1) + min)].toString().trim().toUpperCase()
        code += current
    }

    return code
}

// Socket.io Middlewares
io.of("active_room").use((socket, next) => {
    
    let user_name = socket.handshake.query.user_name
    let room_id = socket.handshake.query.room_id

    if (given(user_name))
    {
        if (given(room_id))
        {
            next()
        }
        else
        {
            next(new Error("SSPlease provide MeetUp ID before joining.."))
        }
    }
    else
    {
        next(new Error("SSPlease provide your name before joining a MeetUp."))
    }

})

io.of("active_room").use((socket, next) => {
    let room_id = socket.handshake.query.room_id

    database.ref("ActiveRooms/" + room_id).get().then(snap => {
        if (snap.hasChild("Active"))
        {
            next()
        }
        else
        {
            next(new Error("This MeetUp is not actively running!"))
        }
    }).catch(() => {
        next(new Error("It seems our servers are currently down."))
    })
})

// WebSocket Connections
io.of("active_room").on("connection", socket => {
    
    let user_name = socket.handshake.query.user_name.toString().trim()
    let room_id = socket.handshake.query.room_id.toString().trim()

    // Join Room
    socket.join("#active_room#room" + room_id)

    // Notify other members
    io.of("active_room").to("#active_room#room" + room_id).emit("user_joined", user_name)

    // Listeners
    socket.on("message", (message) => {
        database.ref("ActiveRooms/" + room_id + "/Typing").get().then(snap => {
            var member_id = snap.child("MemberId").val()

            if (member_id != undefined && member_id != null)
            {
                member_id = member_id.toString()

                if (member_id == socket.id)
                {
                    database.ref("ActiveRooms/" + room_id + "/Typing").set({
                        "MemberId": "",
                        "MemberName": "",
                        "Time": 0
                    })
                }
            }
        })

        if (given(message))
        {
            message = message.toString().trim()

            io.of("active_room").to("#active_room#room" + room_id).emit("receive_message", {
                sender: {
                    name: user_name,
                    id: socket.id
                },
                message: message
            })
        }
    })

    socket.on("typing", () => {
        database.ref("ActiveRooms/" + room_id + "/Typing").set({
            "MemberId": socket.id,
            "MemberName": user_name,
            "Time": Date.now().toString()
        })
    })

    socket.on("end_room", () => {
        database.ref("ActiveRooms/" + room_id).remove().then(() => {
            io.of("active_room").to("#active_room#room" + room_id).emit("room_ended", user_name)
        })
    })

    // Disconnect Event
    socket.on("disconnect", () => {
        database.ref("ActiveRooms/" + room_id + "/Typing").get().then(snap => {
            var member_id = snap.child("MemberId").val()

            if (member_id != undefined && member_id != null)
            {
                member_id = member_id.toString()

                if (member_id == socket.id)
                {
                    database.ref("ActiveRooms/" + room_id + "/Typing").remove()
                }
            }
        })

        io.of("active_room").to("#active_room#room" + room_id).emit("user_left", user_name)
    })

    // Send typing status
    database.ref("ActiveRooms/" + room_id + "/Typing").on("value", snap => {
        let member_id = snap.child("MemberId").val()
        let member_name = snap.child("MemberName").val()
        let time = snap.child("Time").val()

        if (member_id != undefined && time != undefined && member_id != null && time != null && member_name != undefined && member_name != null)
        {
            member_id = member_id.toString()
            member_name = member_name.toString()
            time = parseInt(time)

            if (member_id != socket.id)
            {
                socket.emit("typing_info", {
                    member: member_name,
                    member_id: member_id,
                    time: time
                })
            }
        }
    })

})
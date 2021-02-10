module.exports = function(io){
    io.of('/chat').on("connection", (socket) => {
        //this socket is authenticated, we are good to handle more events from it.
        // console.log(`hello! ${socket.decoded_token.name}`);
        console.log("client connected", new Date());
          socket.on("join", function(room) {
            console.log("somebody create room with name ", room);
            socket.join(room);
        });
    
        // untuk event mengajak orang untuk listen ke room tertentu
        socket.on("invite", ({ room, data }) => {
            console.log("someone inviting...");
            socket.to(room).emit("Invite", data);
        });
    
        // untuk event pesan
        socket.on("message", ({ room, data }) => {
            socket.to(room).emit("Message", data);
            console.log(room, data);
        });
    
        // untuk event mengetik
        socket.on("typing", ({ room }) => {
            socket.to(room).emit("Typing", "Someone is typing");
        });
    
        // untuk event stop mengetik
        socket.on("stopped_typing", ({ room }) => {
            socket.to(room).emit("StoppedTyping");
        });

         // untuk event test
         socket.on("test", ({ room }) => {
            socket.to(room).emit("test");
        });
    });
    // io.on("connection", (socket) => {
    //     console.log("client connected", new Date());
    //       socket.on("join", function(room) {
    //         console.log("somebody create room with name ", room);
    //         socket.join(room);
    //     });
    
    //     // untuk event mengajak orang untuk listen ke room tertentu
    //     socket.on("invite", ({ room, data }) => {
    //         console.log("someone inviting...");
    //         socket.to(room).emit("Invite", data);
    //     });
    
    //     // untuk event pesan
    //     socket.on("message", ({ room, data }) => {
    //         socket.to(room).emit("Message", data);
    //         console.log(room, data);
    //     });
    
    //     // untuk event mengetik
    //     socket.on("typing", ({ room }) => {
    //         socket.to(room).emit("Typing", "Someone is typing");
    //     });
    
    //     // untuk event stop mengetik
    //     socket.on("stopped_typing", ({ room }) => {
    //         socket.to(room).emit("StoppedTyping");
    //     });
    // });
}
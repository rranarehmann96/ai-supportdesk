import Message from "../models/Message.js";
import Ticket from "../models/Ticket.js";
import Workspace from "../models/Workspace.js";
import { answerAsAIAssistant } from "../utils/aiClient.js";
import { sendMail } from "../utils/mailer.js";

const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Join a specific ticket's chat room
    socket.on("join_ticket", (ticketId) => {
      socket.join(ticketId);
    });

    // Someone sends a message
    socket.on("send_message", async ({ ticketId, sender, senderName, text }) => {
      try {
        const message = await Message.create({
          ticket: ticketId,
          sender,
          senderName,
          text,
        });

        // Broadcast to everyone in that ticket's room (including sender)
        io.to(ticketId).emit("receive_message", message);

        // If an agent just replied, email the customer so they know to check back
        if (sender === "agent") {
          const ticket = await Ticket.findById(ticketId);
          if (ticket) {
            const workspace = await Workspace.findById(ticket.workspace);
            const chatUrl = `${process.env.CLIENT_URL}/support/${workspace?.slug}/ticket/${ticketId}`;
            sendMail({
              to: ticket.customerEmail,
              subject: `New reply on your ticket: ${ticket.subject}`,
              html: `
                <p>Hi ${ticket.customerName},</p>
                <p><b>${senderName}</b> replied to your support ticket "${ticket.subject}":</p>
                <blockquote>${text}</blockquote>
                <p><a href="${chatUrl}">View the conversation</a></p>
              `,
            });
          }
        }
      } catch (error) {
        socket.emit("error_message", { message: "Failed to send message" });
      }
    });

    // Typing indicator
    socket.on("typing", ({ ticketId, senderName }) => {
      socket.to(ticketId).emit("user_typing", { senderName });
    });

    // Customer asks the AI assistant instead of waiting for a human agent
    socket.on("ask_ai", async ({ ticketId, senderName, text }) => {
      try {
        // Save and broadcast the customer's question first
        const customerMessage = await Message.create({
          ticket: ticketId,
          sender: "customer",
          senderName,
          text,
        });
        io.to(ticketId).emit("receive_message", customerMessage);

        io.to(ticketId).emit("ai_thinking", true);

        const ticket = await Ticket.findById(ticketId);
        const history = await Message.find({ ticket: ticketId }).sort({ createdAt: 1 });

        const aiText = await answerAsAIAssistant(ticket.subject, history);

        const aiMessage = await Message.create({
          ticket: ticketId,
          sender: "ai",
          senderName: "AI Assistant",
          text: aiText || "Sorry, I couldn't come up with an answer — a human agent will follow up shortly.",
        });

        io.to(ticketId).emit("ai_thinking", false);
        io.to(ticketId).emit("receive_message", aiMessage);
      } catch (error) {
        io.to(ticketId).emit("ai_thinking", false);
        socket.emit("error_message", { message: "AI assistant failed to respond" });
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};

export default registerSocketHandlers;

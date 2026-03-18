import questionIcon from "../images/icons/question.png";
import defaultClippy from "../images/animations/Default.png";
import { MessageRecord } from "../../types/interfaces";
import { useTranslation } from "../contexts/SharedStateContext";

import { WelcomeMessageContent } from "./WelcomeMessageContent";

export interface Message extends MessageRecord {
  id: string;
  content?: string;
  children?: React.ReactNode;
  createdAt: number;
  sender: "user" | "clippy";
}

export function Message({ message }: { message: Message }) {
  const t = useTranslation();
  const isWelcome = message.content === t.welcome_to_clippy;
  const senderClass =
    message.sender === "user" ? "message-user" : "message-assistant";

  return (
    <div className={`message ${senderClass}`}>
      <div className="message-avatar-wrap">
        <img
          className="message-avatar"
          src={message.sender === "user" ? questionIcon : defaultClippy}
          alt={`${message.sender === "user" ? "You" : "Clippy"}`}
        />
      </div>
      <div className="message-body">
        <div className="message-meta">
          <span className="message-author">
            {message.sender === "user" ? "You" : "Clippy"}
          </span>
        </div>
        {message.images && message.images.length > 0 && (
          <div className="message-images">
            {message.images.map((img, idx) => (
              <img key={`img-${idx}`} src={img} alt={`Attachment ${idx + 1}`} />
            ))}
          </div>
        )}
        <div className="message-content">
          {isWelcome ? (
            <WelcomeMessageContent />
          ) : message.children ? (
            message.children
          ) : (
            // Dynamic import for ESM compatibility
            <span>{message.content}</span>
          )}
        </div>
      </div>
    </div>
  );
}

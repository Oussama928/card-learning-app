import React, { useState, useEffect } from "react";
import Link from "next/link";
import FavoriteIcon from "@mui/icons-material/Favorite";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import IconButton from "@mui/material/IconButton";
import { useSession } from "next-auth/react";
import Edit from "../cardAdd/page";
import { useRouter } from "next/navigation";
interface CardProps {
  data: {
    title: string;
    target_language: string;
    total_words: number;
    id: string;
  };
}

const Card: React.FC<CardProps> = ({
  data,
  isfavorited,
  setCards,
  delete_item,
  setIsEditing,

}) => {
  const [isFavorited, setIsFavorited] = useState(isfavorited);
  const { data: session } = useSession();
  const router = useRouter();
  useEffect(() => {
    setIsFavorited(isfavorited);
  }, [isfavorited]);

  const handleClick = async () => {
    if (isFavorited == true && setCards) {
      setCards((prev) => {
        console.log("prev", prev);
        return prev.filter((card) => card.id !== data.id);
      });
    }
    const newIsFavorited = !isFavorited;
    setIsFavorited(newIsFavorited);
    const payload = {
      user_id: parseInt(session?.user?.id, 10),
      card_id: data?.id,
      intent: newIsFavorited ? "add" : "remove",
    };
    console.log(payload);

    try {
      const res = await fetch("http://localhost:3000/api/handleFavorites", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          authorization: `Bearer ${session?.user?.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const responseData = await res.json();
      console.log(responseData);
    } catch (error) {
      console.error("Error:", error);
    }
  };
  const handleDelete = async () => {
    const del = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/deleteCard/${data.id}`,
          {
            method: "DELETE",
            body: JSON.stringify({ id: data.id }),
            headers: {
              authorization: `Bearer ${session?.user?.accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        const responseData = await res.json();
        console.log(responseData);
        setCards((prev) => {
          return prev.filter((card) => card.id !== data.id);
        });
      } catch (error) {
        console.error("Error:", error);
      }
    };
    del();
  };


  return (
    <div
      className="p-6  flex flex-col gap-4 rounded-xl transition-all duration-300 hover:transform hover:translate-y-[-6px]"
      style={{
        background: "linear-gradient(145deg, #2a3f54 0%, #1e2b3a 100%)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          paddingBottom: "12px",
        }}
      >
        <h3
          style={{
            color: "#fff",
            fontSize: "1.5rem",
            fontWeight: 600,
            margin: 0,
            letterSpacing: "0.5px",
            marginBottom: "8px",
          }}
        >
          {data.title}
        </h3>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "#7fcac9",
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: 500,
              border: "1px solid rgba(127,202,201,0.3)",
            }}
          >
            {data.target_language}
          </span>

          <span
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <svg
              style={{ width: "16px", height: "16px", fill: "currentColor" }}
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            {data.total_words} words
          </span>
          <IconButton onClick={handleClick}>
            <FavoriteIcon
              style={{
                color: isFavorited ? "red" : "gray",
                transition: "color 0.3s",
              }}
            />
          </IconButton>
          {delete_item && (
            <>
              <IconButton
                onClick={handleDelete}
                style={{
                  padding: "4px",
                  borderRadius: "50%",
                  transition: "background-color 0.3s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#92969c66")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                {" "}
                <DeleteIcon
                  style={{
                    color: "gray",
                    transition: "color 0.3s",
                  }}
                />
              </IconButton>
              <IconButton
                onClick={() => setIsEditing([true, data.id])}
                style={{
                  padding: "4px",
                  borderRadius: "50%",
                  transition: "background-color 0.3s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#92969c66")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <EditIcon style={{ color: "gray" }} />
              </IconButton>
            </>
          )}
        </div>
      </div>
      <div
      
        style={{
          
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div className="cursor-pointer"
      onClick={() => router.push(`/profile/${data.owner.id}`)} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img
          
            width={40}
            height={40}
            src={data?.owner?.image ? data?.owner?.image : "/avatar.jpeg"}
            alt="Avatar"
            style={{
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid rgba(127,202,201,0.5)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: "0.85rem",
              }}
            >
              Created by
            </span>
            <span
              style={{
                color: "#7fcac9",
                fontSize: "0.95rem",
                fontWeight: 500,
              }}
            >
              {data.owner.username}
            </span>
          </div>
        </div>
        <Link href={`/learning/${data.id}`} style={{ textDecoration: "none" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#7fcac9",
              fontSize: "0.9rem",
              padding: "8px 12px",
              borderRadius: "8px",
              transition: "all 0.2s ease",
            }}
          >
            Start Now
            <svg
              style={{ width: "16px", height: "16px", fill: "currentColor" }}
              viewBox="0 0 24 24"
            >
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Card;

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaHeart, FaTrash, FaEdit } from "react-icons/fa";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CardProps } from "@/types";
import { deleteCard, toggleFavorite } from "@/services/cardService";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";

const CardItem: React.FC<CardProps> = ({
  data,
  isfavorited,
  setCards,
  delete_item,
  setIsEditing,
  removeOnUnfavorite = false,
}) => {
  const [isFavorited, setIsFavorited] = useState(Boolean(isfavorited));
  const { data: session } = useSession();
  const router = useRouter();
  useEffect(() => {
    setIsFavorited(Boolean(isfavorited));
  }, [isfavorited]);

  const handleClick = async () => {
    if (isFavorited == true && setCards && removeOnUnfavorite) {
      setCards((prev) => {
        if (!prev) return prev;
        return prev.filter((card) => card.id !== data.id);
      });
    }
    const newIsFavorited = !isFavorited;
    setIsFavorited(newIsFavorited);
    const payload = {
      card_id: data?.id,
      intent: newIsFavorited ? "add" : "remove",
    };
    console.log(payload);

    try {
      const token = session?.user?.accessToken;
      if (!token) return;
      await toggleFavorite(data.id, newIsFavorited ? "add" : "remove", token);
    } catch (error) {
      console.error("Error:", error);
    }
  };
  const handleDelete = async () => {
    try {
      const token = session?.user?.accessToken;
      if (!token) return;
      await deleteCard(data.id, token);
      setCards?.((prev) => (prev ? prev.filter((card) => card.id !== data.id) : prev));
    } catch (error) {
      console.error("Error:", error);
    }
  };


  return (
    <Card className="flex flex-col gap-4 rounded-xl transition-all duration-300 hover:transform hover:translate-y-[-6px] hover:shadow-lg border-primary/20 bg-gradient-to-br from-card to-muted/50">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-2xl font-semibold tracking-tight mb-2 text-foreground">
          {data.title}
        </CardTitle>

        <div className="flex gap-3 items-center">
          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
            {data.target_language}
          </Badge>


          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <svg
              className="w-4 h-4 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            {data.total_words} words
          </span>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost" 
              size="icon"
              onClick={handleClick}
              className={`rounded-full hover:bg-muted ${isFavorited ? 'text-destructive' : 'text-muted-foreground'}`}
              aria-label={isFavorited ? "Remove favorite" : "Add favorite"}
            >
              <FaHeart className="w-4 h-4" />
            </Button>
            
            {delete_item && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                >
                  <FaTrash className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing?.([true, data.id])}
                  className="rounded-full hover:bg-muted text-muted-foreground"
                >
                  <FaEdit className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 flex items-center justify-between">
        {data?.owner ? (
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => router.push(`/profile/${data.owner?.id}`)}
          >
            <Image
              width={40}
              height={40}
              src={data.owner?.image ? data.owner.image : "/avatar.jpeg"}
              alt="Avatar"
              className="rounded-full object-cover border-2 border-primary/50 shadow-sm group-hover:border-primary transition-colors"
            />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">
                Created by
              </span>
              <span className="text-sm font-medium text-primary group-hover:underline">
                {data.owner?.username}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Image
              width={40}
              height={40}
              src="/avatar.jpeg"
              alt="Avatar"
              className="rounded-full object-cover border-2 border-primary/50 shadow-sm"
            />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">
                Created by
              </span>
              <span className="text-sm font-medium text-primary">
                Unknown
              </span>
            </div>
          </div>
        )}
        
        <Link href={`/learning/${data.id}`}>
          <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10 gap-2">
            Start Now
            <svg
              className="w-4 h-4 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
            </svg>
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default CardItem;

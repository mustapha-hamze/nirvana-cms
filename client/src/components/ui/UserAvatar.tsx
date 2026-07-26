import { Avatar, AvatarFallback } from "@/components/ui/avatar"

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
}

export default function UserAvatar({ name }: { name: string }) {
  return (
    <Avatar>
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  )
}

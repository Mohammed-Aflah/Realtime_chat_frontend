import SidebarSearchFilter from "@/components/custom/SidebarSearchFilter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { baseURL } from "@/constant/constant";
import { getAllUsers } from "@/redux/actions/User/allUserAction";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { FaPaperclip } from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import io from "socket.io-client";
import WelcomeSection from "./Welcom";
import { getSpecifChat, sendChat } from "@/redux/actions/Chat/getSpcificChat";
import { OnlineUsers, messagesType, sendChatBody } from "@/types/chatType";
import ButtonLoader from "@/components/custom/ButtonLoader";
import { getMessage } from "@/redux/slices/chatSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { oneUserType } from "@/types/Alluser";
import { Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
function Chat() {
  const { toast } = useToast();
  const [message, setMessage] = useState<string>("");
  const buttonRef = useRef<HTMLInputElement>(null);
  const [typings, setTypings] = useState<{ id: string; status: boolean }[]>([]);
  const dispatch: AppDispatch = useDispatch();
  const chats = useSelector((state: RootState) => state?.chat?.chat?.messages);
  const [allChats, setAllChat] = useState<messagesType[]>([]);
  const [onlineusers, setOnlineUsers] = useState<OnlineUsers[]>([]);
  const [allUsers, setAllUsers] = useState<oneUserType[]>([]);
  const users: oneUserType[] | null = useSelector(
    (state: RootState) => state.allUsers.users
  );
  // const
  useEffect(() => {
    // Separate online users and offline users
    if (users) {
      const onlineUsers = users.filter((user) =>
        onlineusers.some((onlineUser) => onlineUser.userId === user._id)
      );
      const offlineUsers = users.filter(
        (user) =>
          !onlineusers.some((onlineUser) => onlineUser.userId === user._id)
      );
      setAllUsers([...onlineUsers, ...offlineUsers]);
    }
    // Your logic to update the UI based on onlineUsers and offlineUsers
  }, [onlineusers, users]);
  const myDetails: oneUserType = useSelector(
    (state: RootState) => state?.user?.user?.user
  );
  const chat = useSelector((state: RootState) => state.chat?.chat);
  const { loading } = useSelector((state: RootState) => state.chat);
  const scrollArea = useRef<HTMLDivElement>(null);
  const chatId: string = useSelector(
    (state: RootState) => state?.chat?.chat?.chatId
  );
  const navigate = useNavigate();
  const selectedUser = useSelector(
    (state: RootState) => state.chat.selectedUser
  );
  async function showChatWithUser(id: string) {
    const data = {
      currentId: myDetails._id,
      toId: id,
    };
    localStorage.setItem("selecteUser", JSON.stringify(data));
    await dispatch(getSpecifChat(data));
    if (window.innerWidth < 640) {
      navigate("/mobile");
    }
  }
  useEffect(() => {
    if (scrollArea.current) {
      scrollArea.current.scrollTop = scrollArea.current.scrollHeight;
    }
  }, [allChats]);
  function messageBoxForm(event: FormEvent) {
    event.preventDefault();
    buttonRef?.current?.click();
  }
  async function handleSendMessage() {
    if (message.trim()) {
      const socket: Socket = io(baseURL);
      const body: sendChatBody = {
        chatId: chatId,
        content: message,
        senderId: myDetails._id,
      };

      socket.emit("send-message", {
        message,
        recipienId: selectedUser._id,
        chatId,
        senderId: myDetails._id,
        senderName: myDetails.username,
      });
      const chatBody: messagesType = {
        _id: uuidv4(),
        content: message,
        senderId: myDetails._id,
        chatId: chatId,
        createdAt: new Date(),
        date: new Date(),
        senderName:myDetails.username
      };
      setAllChat((preve) => [...preve, chatBody]);
      setMessage("");
      await dispatch(sendChat(body));
    }
  }
  useEffect(() => {
    setAllChat(chats);
  }, [chats]);
  useEffect(() => {
    const socket: Socket = io(baseURL);
    async function selectChat() {
      const uesrDetails: string | null = localStorage.getItem("selecteUser");
      if (uesrDetails) {
        await dispatch(getSpecifChat(JSON.parse(uesrDetails)));
      }
    }
    selectChat();
    socket.on("connect", () => {
      console.log("Connected to server");
    });
    socket.on("getOnlineUsers", (data: OnlineUsers[]) => {
 
      setOnlineUsers(data);
    });
    socket?.emit("add-user", myDetails._id);
    socket.on("getMessage", async (res: messagesType) => {
      toast({
        title: res.senderName,
        description: res.content,
        className: cn(
          "top-2 right-2 w-[90%] flex fixed sm:max-w-[420px] md:top-4 md:right-4"
        ),
      });
      const obj: string | null = localStorage.getItem("selecteUser");

      if (obj) {
        const selectedUserData: {
          currentId: string;
          toId: string;
        } = JSON.parse(obj);

   

        if (selectedUserData.toId === res.senderId) {
          dispatch(getMessage(res));
          setAllChat((prev) => [...prev, res]);
        }
      } else {
        dispatch(getMessage(res));
        setAllChat((prev) => [...prev, res]);
      }
    });

    socket.on("typing", (res) => {
      const typeSet = new Set(...typings.map((type) => type.id));
      if (!typeSet.has(res.Id)) {
        
       

        setTypings([...typings, { id: res.Id, status: true }]);
      }
    });
    socket.on("stoppedTyping", (res) => {
      setTypings((prevData) => {
        return prevData.map((typings) =>
          typings.id === res.Id ? { ...typings, status: false } : typings
        );
      });
    });
    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });
    return () => {
      socket.off("getMessage");
      socket.disconnect();
      socket.off("typing");
      // localStorage.removeItem("selecteUser");
      setTypings([]);
    };
  }, []);

  useEffect(() => {
    async function fetAllUsers() {
      await dispatch(getAllUsers(myDetails._id));
    }
    fetAllUsers();
  }, [dispatch, myDetails._id]);

  const handleMessageInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const socket: Socket = io(baseURL);
    setMessage(e?.target?.value);
    socket.emit("typing", {
      msg: "typing",
      recipienId: selectedUser._id,
      name: myDetails.username,
      Id: myDetails._id,
    });
    setTimeout(() => {
      socket.emit("stoppedTyping", {
        msg: "typing",
        recipienId: selectedUser._id,
        name: myDetails.username,
        Id: myDetails._id,
      });
    }, 3000);
  };

  return (
    <section className="w-full mx-auto h-screen  flex justify-between">
      <aside className="w-full  h-full sm:w-[630px] md:w-[495px] lg:w-[590px]  flex flex-col p-3 border-r ">
        <SidebarSearchFilter />
        <div className={"w-full   h-[100vh] overflow-y-auto gap-y-1"}>
          {allUsers?.map((userdata: oneUserType, Idx: number) => (
            <div
              key={userdata._id}
              className={`w-full h-16  ${
                Idx + 1 !== users?.length && "border-b"
              }  flex items-center justify-between px-2 hover:bg-userHover cursor-pointer`}
              onClick={() => showChatWithUser(userdata._id)}
            >
              <div className="relative">
                {onlineusers?.some(
                  (user: OnlineUsers) => user?.userId == userdata._id
                ) && (
                  <span className="w-[10px] h-[10px] rounded-full bg-slate-200  absolute top-0 left-0 z-10 flex items-center justify-center">
                    <span
                      className={
                        "w-[6px] h-[6px] rounded-full bg-green-500 animate-ping"
                      }
                    ></span>
                  </span>
                )}

                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
              </div>
              <div className="w-full  flex flex-col px-2">
                <span className="font-semibold text-1xl ">
                  {userdata.username}
                </span>
                <span className="font-thin text-sm">
                  {typings.find((typings) => typings.id === userdata._id)
                    ?.status ? (
                    <span className="text-green-700 font-bold">typing...</span>
                  ) : (
                    "Hi how are you "
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </aside>
      {chat ? (
        <main className="hidden sm:block h-full w-full  p-2">
          <header className="w-full h-16  border-b flex items-center">
            <div className="flex gap-3 items-center">
              <Avatar className="relative">
                <AvatarImage
                  src={
                    !selectedUser?.profile
                      ? "https://github.com/shadcn.png"
                      : selectedUser.profile
                  }
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div className="flex flex-col  w-full">
                <span className="font-semibold text-[18px]">
                  {selectedUser?.username}
                </span>
                <span className="text-sm flex items-center gap-1">
                  {typings.find((typings) => typings.id === selectedUser._id)
                    ?.status ? (
                    <>
                      <span className="w-[8px] h-[8px] rounded-full bg-blue-500 block"></span>
                      <p>
                        typing<span className="animate-pulse">...</span>{" "}
                      </p>
                    </>
                  ) : onlineusers.find(
                      (data: OnlineUsers) => data?.userId === selectedUser?._id
                    ) ? (
                    <>
                      <span className="w-[8px] h-[8px] rounded-full bg-green-500 block animate-ping"></span>
                      Online
                    </>
                  ) : (
                    <>
                      <span className="w-[8px] h-[8px] rounded-full bg-red-300 block"></span>
                      Offline
                    </>
                  )}
                </span>
              </div>
            </div>
          </header>
          <main className="w-full h-full  space-y-1">
            <div
              className="w-full h-[85%]  overflow-auto py-2 pr-2"
              ref={scrollArea}
              // onScroll={()=>alert("ehl")}
            >
              {allChats?.length <= 0 && (
                <div className="px-1  bg-gray-900 rounded-sm text-black flex flex-col  items-center max-w-[200px] flex-wrap break-words mx-auto">
                  <div className="w-full  flex justify-center  text-white p-1">
                    no message sended🚉
                  </div>
                </div>
              )}
              {allChats?.map(
                (content: {
                  _id: null | undefined | string;
                  senderId: string;
                  content: string | number | null | undefined;
                  createdAt: string | number | Date;
                }) => (
                  <div
                    key={content._id}
                    className={`w-full  flex ${
                      myDetails._id == content.senderId
                        ? "justify-end"
                        : "justify-start"
                    }  py-2`}
                  >
                    <div
                      key={content._id}
                      className={`px-1 py-1  rounded-sm text-black flex flex-col  items-center max-w-[200px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px] flex-wrap break-words ${
                        myDetails._id == content.senderId
                          ? "bg-ternary text-white rounded-lg rounded-tr-none"
                          : "bg-slate-300  text-[black] rounded-lg rounded-tl-none"
                      }`}
                    >
                      <div className="w-full justify-start">
                        {content.content}
                      </div>
                      <div
                        className={`text-sm flex  w-full ${
                          myDetails._id == content.senderId
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        {/* <span>10:22</span> */}
                        <span>{`${new Date(
                          content.createdAt
                        ).getHours()}:${new Date(
                          content.createdAt
                        ).getMinutes()}`}</span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
            <div className="h-[10%]  flex items-start justify-between gap-4">
              <form
                className="w-full h-[60%] rounded-md  flex pl-4 pr-1 bg-background border"
                onSubmit={messageBoxForm}
              >
                <Input
                  type="text"
                  placeholder="Send message.."
                  value={message}
                  className="h-full border-none outline-0 p-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  onChange={handleMessageInputChange}
                />
                <Button
                  className="text-[18px] p-0 m-0 h-full px-4 bg-transparent text-white hover:bg-transparent"
                  type="button"
                >
                  <FaPaperclip />
                </Button>
              </form>
              <div
                onClick={handleSendMessage}
                ref={buttonRef}
                className={`bg-background h-[60%] w-12 flex items-center justify-center rounded-md text-[18px] hover:bg-slate-950 border ${
                  loading || message.trim().length > 0
                    ? "cursor-pointer bg-ternary"
                    : "cursor-not-allowed pointer-events-none"
                }`}
              >
                {loading ? <ButtonLoader /> : <IoSend />}
              </div>
            </div>
          </main>
        </main>
      ) : (
        <WelcomeSection />
      )}
    </section>
  );
}

export default Chat;

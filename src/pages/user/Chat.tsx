/* eslint-disable @typescript-eslint/no-explicit-any */
// import SideBarUser from "@/components/custom/SideBarUser";
import SidebarSearchFilter from "@/components/custom/SidebarSearchFilter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { baseURL } from "@/constant/constant";
import { getAllUsers } from "@/redux/actions/User/allUserAction";
import {
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal,
  useEffect,
  useRef,
  useState,
} from "react";
import { FaPaperclip } from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import io from "socket.io-client";
import WelcomeSection from "./Welcom";
import { getSpecifChat, sendChat } from "@/redux/actions/Chat/getSpcificChat";
import { sendChatBody } from "@/types/chatType";
import ButtonLoader from "@/components/custom/ButtonLoader";
import toast from "react-hot-toast";
import { getMessage } from "@/redux/slices/chatSlice";
function Chat() {
  const [message, setMessage] = useState("");

  const [, setSocketconnection] = useState<any>(null);
  const [onlineusers, setOnlineUsers] = useState([]);
  const dispatch = useDispatch();
  const chats = useSelector((state) => state?.chat?.chat?.messages);
  const users = useSelector((state) => state?.allUsers?.users?.users);
  const myDetails = useSelector((state) => state?.user?.user?.user);
  const chat = useSelector((state) => state.chat.chat);
  const { loading } = useSelector((state) => state.chat);
  const scrollArea = useRef();
  const chatId: string = useSelector((state) => state?.chat?.chat?.chatId);
  const selectedUser = useSelector((state) => state.chat.selectedUser);
  async function showChatWithUser(id: string) {
    const data = {
      currentId: myDetails._id,
      toId: id,
    };
    await dispatch(getSpecifChat(data));
  }
  async function handleSendMessage() {
    if (message) {
      if (scrollArea.current) {
        const { scrollHeight, clientHeight } = scrollArea.current;
        scrollArea.current.scrollTop = scrollHeight - clientHeight;
      }
      const socket: any = io(baseURL);
      
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
      });

      await dispatch(sendChat(body)).then((res) => {
        console.log("🚀 ~ awaitdispatch ~ res:", res)
        
        
        setMessage("");
      });
    }
  }

  useEffect(() => {
    const socket: any = io(baseURL);
    setSocketconnection(socket);

    socket.on("connect", () => {
      console.log("Connected to server");
    });
    socket.on("getOnlineUsers", (data: any) => {
      setOnlineUsers(data);
    });
    console.log(onlineusers);
    socket?.emit("add-user", myDetails._id);
    socket.on("getMessage", async (res) => {
      // alert(JSON.stringify(res.content))
      console.log(res, " Res");
      dispatch(getMessage(res));

      toast.success(res.content);
    });
    socket.on("typing", (res) => {
      console.log("type");

      toast.success(res);
    });
    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });
    return () => {
      socket.off("getMessage");
      socket.disconnect();
      socket.off("typing");
    };
  }, []);

  useEffect(() => {
    async function fetAllUsers() {
      await dispatch(getAllUsers(myDetails._id));
    }
    fetAllUsers();
  }, [dispatch, myDetails._id]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMessageInputChange = (e: Event | any) => {
    const socket: any = io(baseURL);
    setMessage(e?.target?.value);
    socket.emit("typing", {
      msg: "typing",
      recipienId: selectedUser._id,
      name: myDetails.username,
      Id: myDetails._id,
    });
  };
  return (
    <section className="w-full mx-auto h-screen  flex justify-between">
      <aside className="w-full  h-full sm:w-[630px] md:w-[495px] lg:w-[590px]  flex flex-col p-3 border-r ">
        <SidebarSearchFilter />
        <div className={"w-full   h-[100vh] overflow-y-auto gap-y-1"}>
          <div className="w-full h-16 border-b  flex items-center justify-between px-2 hover:bg-userHover cursor-pointer">
            <div className="relative">
              <span className="w-[10px] h-[10px] rounded-full bg-slate-200  absolute top-0 left-0 z-10 flex items-center justify-center">
                <span className="w-[6px] h-[6px] rounded-full bg-green-500"></span>
              </span>
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </div>
            <div className="w-full  flex flex-col px-2">
              <span className="font-semibold text-1xl ">demo</span>
              <span className="font-thin text-sm">Hi how are you </span>
            </div>
          </div>
          {users?.map((userdata: any, Idx: number) => (
            <div
              key={userdata._id}
              className={`w-full h-16  ${
                Idx + 1 !== users.length && "border-b"
              }  flex items-center justify-between px-2 hover:bg-userHover cursor-pointer`}
              onClick={() => showChatWithUser(userdata._id)}
            >
              <div className="relative">
                {onlineusers?.some(
                  (user: any) => user?.userId == userdata._id
                ) && (
                  <span className="w-[10px] h-[10px] rounded-full bg-slate-200  absolute top-0 left-0 z-10 flex items-center justify-center">
                    <span
                      className={"w-[6px] h-[6px] rounded-full bg-green-500"}
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
                <span className="font-thin text-sm">Hi how are you </span>
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
                  {selectedUser.username}
                </span>
                <span className="text-sm flex items-center gap-1">
                  <span className="w-[8px] h-[8px] rounded-full bg-green-500 block"></span>
                  Online
                </span>
              </div>
            </div>
          </header>
          <main className="w-full h-full  space-y-1">
            <div
              className="w-full h-[85%]  overflow-auto py-2 pr-2"
              ref={scrollArea}
            >
              {chats?.length <= 0 && (
                <div className="px-1  bg-gray-900 rounded-sm text-black flex flex-col  items-center max-w-[200px] flex-wrap break-words mx-auto">
                  <div className="w-full  flex justify-center  text-white p-1">
                    no message sended🚉
                  </div>
                </div>
              )}
              {chats?.map(
                (content: {
                  _id: Key | null | undefined;
                  senderId: any;
                  content:
                    | string
                    | number
                    | boolean
                    | ReactElement<any, string | JSXElementConstructor<any>>
                    | Iterable<ReactNode>
                    | ReactPortal
                    | null
                    | undefined;
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
                      className="px-1  bg-slate-300 rounded-sm text-black flex flex-col  items-center max-w-[200px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px] flex-wrap break-words"
                    >
                      <div className="w-full justify-start">
                        {content.content}
                      </div>
                      <div className="text-sm flex justify-end w-full">
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
              <div className="w-full h-[60%] rounded-md  flex pl-4 pr-1 bg-background border">
                <Input
                  type="text"
                  placeholder="Send message.."
                  value={message}
                  className="h-full border-none outline-0 p-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  onChange={handleMessageInputChange}
                />
                <Button className="text-[18px] p-0 m-0 h-full px-4 bg-transparent text-white hover:bg-transparent">
                  <FaPaperclip />
                </Button>
              </div>
              <div
                onClick={handleSendMessage}
                className={`bg-background h-[60%] w-12 flex items-center justify-center rounded-md text-[18px] hover:bg-slate-950 border ${
                  loading || message.length > 0
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
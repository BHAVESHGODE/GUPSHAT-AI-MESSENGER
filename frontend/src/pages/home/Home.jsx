import MessageContainer from "../../components/messages/MessageContainer";
import Sidebar from "../../components/sidebar/Sidebar";

const Home = () => {
  return (
    <div className="animated-edge-frame max-w-[1244px] w-full my-auto flex items-center justify-center">
      <div className="flex flex-col sm:flex-row h-[92vh] sm:h-[88vh] w-full glass-panel overflow-hidden">
        <Sidebar />
        <MessageContainer />
      </div>
    </div>
  );
};

export default Home;

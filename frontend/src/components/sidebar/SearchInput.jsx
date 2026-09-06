import { IoSearchSharp } from "react-icons/io5";
import useConversation from "../../zustand/useConversation";

const SearchInput = () => {
  const { searchQuery, setSearchQuery } = useConversation();

  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder="Search users..."
        className="w-full pl-9 pr-3 py-2 text-sm rounded-full bg-[var(--panel-bg)] text-[color:var(--text-main)] placeholder:text-[color:var(--text-muted)] border border-[color:var(--panel-border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] transition-all shadow-inner backdrop-blur-sm"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <IoSearchSharp className="absolute left-3 top-2.5 w-4 h-4 text-[color:var(--text-muted)]" />
    </div>
  );
};

export default SearchInput;

// STARTER CODE SNIPPET
// import { IoSearchSharp } from "react-icons/io5";

// const SearchInput = () => {
// 	return (
// 		<form className='flex items-center gap-2'>
// 			<input type='text' placeholder='Search…' className='input input-bordered rounded-full' />
// 			<button type='submit' className='btn btn-circle bg-sky-500 text-white'>
// 				<IoSearchSharp className='w-6 h-6 outline-none' />
// 			</button>
// 		</form>
// 	);
// };
// export default SearchInput;
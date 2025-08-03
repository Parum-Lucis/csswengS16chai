import { Link } from "react-router";

function AttendeesCard({ index, name, who_attended, attendance, editChecklist, setEditChecklist, isEditing, docID }: { index: number, name: string; who_attended: string; attendance: boolean, editChecklist: boolean[], setEditChecklist: React.Dispatch<React.SetStateAction<boolean[]>>, isEditing: boolean, docID: string }) {
  return ( // Add the return statement here
    <div
      className={`text-white w-full max-w-2xl flex flex-row items-center mt-2 h-[6vh] text-[1rem] mr-2 font-sans p-1.5 rounded-[5px] font-semibold mb-2 ${attendance ? 'bg-primary' : 'bg-red-400'
        }`}
    >
      <div className="flex justify-center items-center bg-secondary mr-2 text-white p-2 rounded-[5px] w-[15vh] h-[4vh] font-semibold">
        <h3 className="flex">{who_attended}</h3>
      </div>
      <Link to={`/beneficiary/${docID}`} className="block truncate w-35 sm:w-40 text-start text-[15px] sm:text-[1em]">{name}</Link>
      <div className="flex items-center justify-end ml-auto">
        {isEditing && (
          <input
            type="checkbox"
            checked={editChecklist[index]}
            onChange={() => {
              const updEdit = [...editChecklist]
              updEdit[index] = !editChecklist[index]
              console.log(updEdit)
              setEditChecklist(updEdit)
            }
            }
            className="form-checkbox h-5 w-5 rounded text-white bg-white border-white checked:accent-secondary checked:border-white ml-auto mr-3"
          />
        )}
      </div>
    </div>
  );
}

export default AttendeesCard;
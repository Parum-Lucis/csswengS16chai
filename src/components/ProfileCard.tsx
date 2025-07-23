function ProfileCard({firstName, lastName, age, sex, sort, id}: {firstName: string, lastName: string, age: number, sex: string, sort: string, id?: string | null; }) {
  return (
    <div className="flex flex-col text-sm relative flex-1">
      <span className="font-bold text-base font-sans">
      {sort === "first"
      ? `${firstName.toUpperCase()} ${lastName}`
      : `${lastName.toUpperCase()}, ${firstName}`}
      </span>
      <span>Age: {age}</span>
      <span>Sex: {sex}</span>

      {id != null && (
      <div
        className="absolute right-2 bottom-2 rounded-full px-2 py-1 text-xs font-semibold"
        style={{ right: 0, bottom: 0, backgroundColor: "#539665" }}
      >
        {id === "waitlisted" ? "Waitlisted" : `Child ID#${id}`}
      </div>
      )}
    </div>
  );
}

export default ProfileCard;
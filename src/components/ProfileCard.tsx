function ProfileCard({firstName, lastName, age, sex, sort}: {firstName: string, lastName: string, age: number, sex: string, sort: string}) {
  return (
    <div className="flex flex-col text-sm">
              <span className="font-bold text-base font-[Montserrat]">
                {sort === "firstName"
                  ? `${firstName.toUpperCase()} ${lastName}`
                  : `${lastName.toUpperCase()}, ${firstName}`}
              </span>
              <span>Age: {age}</span>
              <span>Sex: {sex}</span>
            </div>
  );
}

export default ProfileCard;
import "../css/styles.css";
import { NavLink } from "react-router";
import { Baby, BookUser, CalendarPlus, Undo2, UserPlus } from "lucide-react";

const volunteerURLs = [
    { name: "View", pldt: "volunteer/", Icon: BookUser },
    { name: "Create", pldt: "volunteer/new", Icon: UserPlus },
    { name: "Restore", pldt: "volunteer/deleted", Icon: Undo2 },
];

const beneficiaryURLs = [
    { name: "Create", pldt: "/beneficiary/new", Icon: Baby }, // goes to the non-admin creation page
    { name: "Restore", pldt: "beneficiary/deleted", Icon: Undo2 },
]


const eventURLs = [
    { name: "Create", pldt: "event/new", Icon: CalendarPlus },
]


const URLs = [
    { title: "Volunteer", list: volunteerURLs },
    { title: "Beneficiary", list: beneficiaryURLs },
    { title: "Events", list: eventURLs },
]
function Admin() {
    return (
        <div className="w-full min-h-screen flex bg-secondary items-center justify-center">
            <div className="max-w-4xl grid xl:grid-cols-2">
                {
                    URLs.map(({ title, list }) => (
                        <div className="w-full p-8" key={title}>
                            <h1 className="text-2xl mb-4">{title}</h1>
                            <div className="grid grid-cols-2 md:grid-cols-3 auto-rows-fr wrap-anywhere gap-4 font-sans font-bold w-full max-w-5xl text-white">
                                {list.map(({ name, pldt, Icon }) => (
                                    <NavLink to={pldt} key={`${name}${pldt}`}
                                        className="flex flex-col text-nowrap justify-center items-center duration-100 bg-primary rounded-md text-xl text-center p-6 hover:bg-onhover">
                                        {name}
                                        <Icon className="w-12 h-12" />
                                    </NavLink>
                                ))
                                }
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default Admin;
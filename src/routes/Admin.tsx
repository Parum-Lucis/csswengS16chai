import "../css/styles.css";
import { NavLink } from "react-router";
import { Baby, BookUser, CalendarPlus, Undo2, UserPlus, Wallet, Import} from "lucide-react";
import { toast } from "react-toastify";
import { callImportBeneficiaries, callImportEvents, callImportVolunteers } from "../firebase/cloudFunctions";

const handleImport = async (type: 0 | 1 | 2) => {
        // 0 = import beneficiaries
        // 1 = import volunteers
        // 2 = import event

        // prompt user to upload file
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
                
        input.onchange = async (e: Event) => {
            const target = e.target as HTMLInputElement;
            // when at least one file is uploaded
            if (target.files && target.files.length > 0) {
                const file = target.files[0];
                const reader = new FileReader();

                // check file size
                const maxSize = 10 * 1024 * 1024; // 10MB in bytes
                if (file.size > maxSize) {
                    toast.error("File size exceeds 10MB limit. Please upload a smaller file.");
                    return;
                }

                // check file extension before reading
                if (!file.name.endsWith('.csv')) {
                    toast.error("Please upload a valid CSV file.");
                    return;
                }

                // send csv content to relative function
                reader.onload = async (event) => {
                    // get csv content, store as string
                    const csvContent = event.target?.result as string;
                    
                    // check if file is empty
                    if (!csvContent || !csvContent.trim().length) {
                        toast.error("The uploaded file is empty. Please try again!");
                        return;
                    }
                
                    try {
                        if (type === 0) {
                            const result = await callImportBeneficiaries(csvContent);
                            const { imported, skipped } = result.data;

                            skipped === 0 ?
                                toast.success(`Beneficiaries imported successfully! (${imported} added)`) :
                                toast.warn(`Beneficiaries partially imported (added: ${imported}, skipped: ${skipped}. Either existing or non-conforming data was skipped.`);
                        } else if (type === 1) {
                            const result = await callImportVolunteers(csvContent);
                            const { imported, skipped } = result.data;

                            skipped === 0 ?
                                toast.success(`Volunteers imported successfully! (${imported} added)`) :
                                toast.warn(`Volunteers partially imported (added: ${imported}, skipped: ${skipped}. Either existing or non-conforming data was skipped.`);
                        } else if (type === 2) {
                            const result = await callImportEvents(csvContent);
                            const { imported, skipped } = result.data;

                            skipped === 0 ?
                                toast.success(`Events imported successfully! (${imported} added)`) :
                                toast.warn(`Events partially imported (added: ${imported}, skipped: ${skipped}. Either existing or non-conforming data was skipped.`);
                        }
                    } catch (error: any) {
                        console.error(error);
                        toast.error(error.message ?? "Something went wrong. Please try again later.");                    
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };
const volunteerURLs = [
    { name: "View", pldt: "volunteer", Icon: BookUser },
    { name: "Create", pldt: "volunteer/new", Icon: UserPlus },
    { name: "Restore", pldt: "volunteer/deleted", Icon: Undo2 },
    { name: "Import", onClick: () => handleImport(1), Icon: Import }
];

const beneficiaryURLs = [
    { name: "Create", pldt: "/beneficiary/new", Icon: Baby }, // goes to the non-admin creation page
    { name: "Restore", pldt: "beneficiary/deleted", Icon: Undo2 },
    { name: "Import", onClick: () => handleImport(0), Icon: Import }

]


const eventURLs = [
    { name: "Create", pldt: "event/new", Icon: CalendarPlus },
    { name: "SMS", pldt: "event/smscredits", Icon: Wallet },
    { name: "Import", onClick: () => handleImport(2), Icon: Import }
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
                                {list.map(({ name, pldt, onClick, Icon }) =>
                                    pldt ? (
                                        <NavLink to={pldt} key={`${name}${pldt}`} className="flex flex-col text-nowrap justify-center items-center duration-100 bg-primary rounded-md text-xl text-center p-6 hover:bg-onhover">
                                            {name}
                                            <Icon className="w-12 h-12" />
                                        </NavLink>
                                    ) : (
                                        <button key={name} onClick={onClick} className="flex flex-col text-nowrap justify-center items-center duration-100 bg-primary rounded-md text-xl text-center p-6 hover:bg-onhover" type="button">
                                            {name}
                                            <Icon className="w-12 h-12" />
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    );
}

export default Admin;
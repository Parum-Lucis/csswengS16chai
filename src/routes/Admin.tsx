import "../css/styles.css";
import { NavLink, useNavigate } from "react-router";
import { useContext, useEffect } from "react";
import { UserContext } from "../context/userContext.ts";
import { callImportBeneficiaries, callImportEvents, callImportVolunteers } from '../firebase/cloudFunctions';
import { toast } from "react-toastify";


function Admin(){
    const navigate = useNavigate()
    const user = useContext(UserContext)

    const urls = [
        { name: "Create Beneficiary Profile", pldt: "/create-beneficiary-profile" },
        { name: "Import Beneficiary", onClick: () => { handleImport(0); } },
        { name: "Create Volunteer Profile", pldt: "/create-volunteer-profile" },  
        { name: "Import Volunteer", onClick: () => { handleImport(1); } },
        { name: "Create Event", pldt: "/create-event" },
        { name: "Import Event", onClick: () => { handleImport(2); } }
    ];

    useEffect(() => {
        // If there is no user logged in, skip this page and redirect to login page.
        if (user === null) {
          navigate("/");
        }
    }, [user, navigate]);

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
                            await callImportBeneficiaries(csvContent);
                            toast.success("Import beneficiaries successful!");
                        } else if (type === 1) {
                            await callImportVolunteers(csvContent);
                            toast.success("Import volunteers successful!");
                        } else if (type === 2) {
                            await callImportEvents(csvContent);
                            toast.success("Import events successful!");
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

    return (
        <div className="w-full bg-secondary flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8 relative mt-20">
            <div className="relative w-full max-w-2xl flex flex-col items-center px-4 sm:px-6 overflow-hidden">
            <h1 className="text-center text-5xl font-bold text-primary mb-8 font-sans">Admin Dashboard</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {urls.map((ur) =>
                    ur.pldt ? (
                        <NavLink
                            key={ur.name}
                            to={ur.pldt}
                            className="font-sans font-semibold text-white text-center bg-primary px-5 py-5 rounded-md flex items-center justify-center shadow-lg cursor-pointer hover:opacity-90 transition"
                        >
                            {ur.name}
                        </NavLink>
                    ) : (
                        <button
                            key={ur.name}
                            onClick={ur.onClick}
                            className="font-sans font-semibold text-white text-center bg-primary px-5 py-5 rounded-md flex items-center justify-center shadow-lg cursor-pointer hover:opacity-90 transition"
                        >
                            {ur.name}
                        </button>
                    )
                )}
            </div>
            </div>  
        </div>
    );
}

export default Admin;
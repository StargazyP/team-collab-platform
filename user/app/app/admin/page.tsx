import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminPage(){
    const user = await getServerUser();

    if(!user){
        redirect("/login");
    }

    if(user.role !== "admin"){
        redirect("/");
    }
    return (
        <div>
            <h1>Admin Page</h1>
            <p>Welcome, {user.id}!</p>
            <p>Role: {user.role}</p>
        </div>
    )
}
import Image from "next/image";
import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async  function Home() {
  const user = await getServerUser();
  if(!user){
    redirect("/login");
  }
  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">
          Welcome, {user.id}!
        </h1>
        <p>Role: {user.role}</p>
      </main>
    </div>
  );
}

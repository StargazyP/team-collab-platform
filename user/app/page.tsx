import Image from "next/image";
import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getServerUser();
  if (!user) {
    // 인증되지 않은 경우 로그인 페이지로 리다이렉트
    redirect("/login");
  }
  // 인증된 사용자는 워크스페이스로 자동 리다이렉트
  redirect("/workspaces");
}

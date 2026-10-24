import {redirect} from "next/navigation";
import {AUTH_ENABLED} from "@/lib/auth/mode";
import {AuthShell} from "@/components/auth/AuthShell";import {RegisterForm} from "@/components/auth/RegisterForm";export default function Register(){if(!AUTH_ENABLED)redirect("/gis");return <AuthShell title="สร้างบัญชีผู้ใช้งาน" subtitle="สมัครเพื่อเข้าถึงข้อมูลและเครื่องมือ GIS"><RegisterForm/></AuthShell>}

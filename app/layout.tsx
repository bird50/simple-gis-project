import "./globals.css";
import type {Metadata} from "next";
import {Providers} from "@/components/Providers";
export const metadata:Metadata={title:"ThaiWater GIS | National Water Resources Platform",description:"แพลตฟอร์มข้อมูลภูมิสารสนเทศเพื่อการบริหารจัดการทรัพยากรน้ำ"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="th"><body><Providers>{children}</Providers></body></html>}

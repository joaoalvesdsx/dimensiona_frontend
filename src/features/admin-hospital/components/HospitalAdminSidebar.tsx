import { NavLink, useParams } from 'react-router-dom';
import { Building, Users, Briefcase, ClipboardList, LayoutDashboard, Bed } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getHospitalById, Hospital } from '@/lib/api';

const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => (
    <li>
        <NavLink
            to={to}
            className={({ isActive }) =>
                `flex items-center px-3 py-2 my-1 rounded-md text-sm transition-colors ${
                isActive 
                    ? 'bg-secondary/10 text-secondary font-semibold' 
                    : 'text-gray-200 hover:bg-white/10'
                }`
            }
        >
            {icon}
            <span className="ml-3">{label}</span>
        </NavLink>
    </li>
);

export default function HospitalAdminSidebar() {
    const { hospitalId } = useParams<{ hospitalId: string }>();
    const [hospital, setHospital] = useState<Hospital | null>(null);

    const navItems = [
        { to: `/hospital/${hospitalId}/dashboard`, icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        { to: `/hospital/${hospitalId}/unidades-leitos`, icon: <Bed size={18} />, label: 'Unidades e Leitos' }, // Ponto 1 da sua lista
        { to: `/hospital/${hospitalId}/setores`, icon: <Building size={18} />, label: 'Gerir Setores' },
        { to: `/hospital/${hospitalId}/usuarios`, icon: <Users size={18} />, label: 'Usuários' },
        { to: `/hospital/${hospitalId}/cargos`, icon: <Briefcase size={18} />, label: 'Cargos' },
        { to: `/hospital/${hospitalId}/baseline`, icon: <ClipboardList size={18} />, label: 'Baseline' },
    ];

    useEffect(() => {
        if (hospitalId) {
            getHospitalById(hospitalId).then(setHospital).catch(console.error);
        }
    }, [hospitalId]);

    return (
        <aside className="w-72 bg-primary text-primary-foreground flex flex-col flex-shrink-0">
            <div className="h-16 flex items-center justify-center border-b border-white/20 px-4">
                <h1 className="text-xl font-bold text-white truncate" title={hospital?.nome}>
                    {hospital?.nome || 'A carregar...'}
                </h1>
            </div>
            <nav className="flex-1 px-4 py-6 overflow-y-auto">
                <ul>
                    {navItems.map(item => <NavItem key={item.to} {...item} />)}
                </ul>
            </nav>
        </aside>
    );
}
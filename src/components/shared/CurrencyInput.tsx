import React, { useState, useEffect } from 'react';

// Função para formatar o número como BRL
const formatCurrency = (value: number | string) => {
    const num = Number(String(value).replace(/[^\d]/g, '')) / 100;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Função para extrair o valor numérico do formato BRL
const parseCurrency = (value: string): number => {
    return Number(String(value).replace(/[^\d]/g, '')) / 100;
};

interface CurrencyInputProps {
    value: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function CurrencyInput({ value, onChange, ...props }: CurrencyInputProps) {
    const [displayValue, setDisplayValue] = useState(formatCurrency(value));

    useEffect(() => {
        // Atualiza o valor exibido se o 'value' externo mudar
        setDisplayValue(formatCurrency(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const formatted = formatCurrency(rawValue);
        setDisplayValue(formatted);
        
        // Retorna o valor como string numérica com ponto decimal (ex: "1234.56")
        onChange(String(parseCurrency(rawValue)));
    };

    return (
        <input
            {...props}
            type="text"
            value={displayValue}
            onChange={handleChange}
            className={`p-2 border rounded-md ${props.className || ''}`}
        />
    );
}
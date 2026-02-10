
export const fetchAddressByCep = async (cep: string) => {
    // Remove non-numeric characters
    const cleanCep = cep.replace(/\D/g, '');

    // Check if CEP has 8 digits
    if (cleanCep.length !== 8) {
        return null; // Invalid CEP length
    }

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();

        if (data.erro) {
            return null; // CEP not found
        }

        return {
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
            zip: cleanCep
        };
    } catch (error) {
        console.error("Error fetching address:", error);
        return null;
    }
};

export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

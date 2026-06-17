// Departamentos y ciudades principales de Colombia.
// A futuro pueden agregarse otros países; por ahora solo Colombia.

export interface ColombiaCity {
  name: string
}

export interface ColombiaDepartment {
  name: string
  cities: string[]
}

export const COLOMBIA_DEPARTMENTS: ColombiaDepartment[] = [
  { name: "Amazonas", cities: ["Leticia", "Puerto Nariño"] },
  { name: "Antioquia", cities: ["Medellín", "Bello", "Itagüí", "Envigado", "Apartadó", "Turbo", "Rionegro", "Caucasia"] },
  { name: "Arauca", cities: ["Arauca", "Saravena", "Tame"] },
  { name: "Atlántico", cities: ["Barranquilla", "Soledad", "Malambo", "Sabanalarga"] },
  { name: "Bolívar", cities: ["Cartagena", "Magangué", "Turbaco"] },
  { name: "Boyacá", cities: ["Tunja", "Duitama", "Sogamoso", "Chiquinquirá"] },
  { name: "Caldas", cities: ["Manizales", "Dosquebradas", "La Dorada"] },
  { name: "Caquetá", cities: ["Florencia", "San Vicente del Caguán"] },
  { name: "Casanare", cities: ["Yopal", "Aguazul", "Villanueva"] },
  { name: "Cauca", cities: ["Popayán", "Santander de Quilichao", "Puerto Tejada"] },
  { name: "Cesar", cities: ["Valledupar", "Aguachica", "Codazzi"] },
  { name: "Chocó", cities: ["Quibdó", "Istmina", "Tumaco"] },
  { name: "Córdoba", cities: ["Montería", "Cereté", "Lorica", "Sahagún"] },
  { name: "Cundinamarca", cities: ["Bogotá D.C.", "Soacha", "Facatativá", "Zipaquirá", "Chía", "Fusagasugá", "Madrid", "Mosquera"] },
  { name: "Guainía", cities: ["Inírida"] },
  { name: "Guaviare", cities: ["San José del Guaviare"] },
  { name: "Huila", cities: ["Neiva", "Pitalito", "Garzón"] },
  { name: "La Guajira", cities: ["Riohacha", "Maicao", "Uribia"] },
  { name: "Magdalena", cities: ["Santa Marta", "Ciénaga", "Fundación"] },
  { name: "Meta", cities: ["Villavicencio", "Acacías", "Granada"] },
  { name: "Nariño", cities: ["Pasto", "Tumaco", "Ipiales"] },
  { name: "Norte de Santander", cities: ["Cúcuta", "Ocaña", "Pamplona", "Villa del Rosario"] },
  { name: "Putumayo", cities: ["Mocoa", "Puerto Asís"] },
  { name: "Quindío", cities: ["Armenia", "Calarcá", "Montenegro"] },
  { name: "Risaralda", cities: ["Pereira", "Dosquebradas", "Santa Rosa de Cabal"] },
  { name: "San Andrés y Providencia", cities: ["San Andrés"] },
  { name: "Santander", cities: ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja"] },
  { name: "Sucre", cities: ["Sincelejo", "Corozal", "Sampués"] },
  { name: "Tolima", cities: ["Ibagué", "Espinal", "Melgar"] },
  { name: "Valle del Cauca", cities: ["Cali", "Buenaventura", "Palmira", "Tuluá", "Buga", "Cartago", "Candelaria", "Jamundí", "Yumbo", "Pradera"] },
  { name: "Vaupés", cities: ["Mitú"] },
  { name: "Vichada", cities: ["Puerto Carreño"] },
]

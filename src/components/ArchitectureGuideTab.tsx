import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Database,
  Cpu,
  DollarSign,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Code2,
  Sparkles,
  Search,
  ScanLine,
  Smartphone,
  Server,
  Globe,
} from 'lucide-react';

export const ArchitectureGuideTab: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'viability' | 'data' | 'tech' | 'challenges' | 'business' | 'steps'>('viability');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-800/80 text-blue-200 border border-blue-600 mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            Guia Completo de Criação & Arquitetura
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Como criar um aplicativo de busca de preços em mercados?
          </h2>
          <p className="text-blue-200 text-xs sm:text-sm mt-2 leading-relaxed">
            Respondendo à sua pergunta: <strong className="text-white">Sim, é 100% possível!</strong> Abaixo está todo o mapa técnico, fontes de dados, tecnologias e modelo de negócios que você precisa para tirar a ideia do papel.
          </p>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'viability', label: '1. É Possível? (Visão Geral)', icon: CheckCircle2 },
          { id: 'data', label: '2. De Onde Vêm os Preços?', icon: Database },
          { id: 'tech', label: '3. Tecnologias Necessárias', icon: Cpu },
          { id: 'challenges', label: '4. Desafios & Soluções', icon: ShieldCheck },
          { id: 'business', label: '5. Como Monetizar?', icon: DollarSign },
          { id: 'steps', label: '6. Passo a Passo do MVP', icon: Zap },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                activeSection === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Section Content */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* 1. VIABILITY */}
        {activeSection === 'viability' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">Sim, é 100% Viável e Altamente Procurado</h3>
                <p className="text-xs text-stone-500">Por que o momento é perfeito para este tipo de app no Brasil</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              Supermercados representam uma das maiores fatias do orçamento familiar. A variação de preço entre um atacarejo (ex: Assaí, Atacadão) e um supermercado de bairro para os mesmos itens básicos chega a <strong className="text-emerald-700 font-bold">25% a 40%</strong>. Um app que ajuda as pessoas a economizarem R$ 100 a R$ 300 por mês em compras de mercado tem apelo imediato e retenção altíssima.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5 mb-1">
                  <Globe className="w-4 h-4 text-blue-600" /> Referências Nacionais
                </span>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Apps públicos como o <em>"Menor Preço Brasil"</em> (governamental via SEFAZ) e apps privados como <em>Pelando, Promobit e Méliuz</em> provam que os consumidores adoram comparar preços antes de sair de casa.
                </p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-purple-600" /> O Diferencial da IA
                </span>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Hoje você não precisa digitar manualmente: com IA Multimodal (Google Gemini), o usuário apenas tira uma foto da nota fiscal e todos os itens entram no banco automaticamente.
                </p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5 mb-1">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Economia Real
                </span>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Comprar arroz e carnes na loja A e limpeza na loja B pode poupar centenas de reais por mês para uma família típica.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. DATA SOURCES */}
        {activeSection === 'data' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">De onde conseguir os dados de preços? (O Maior Segredo)</h3>
                <p className="text-xs text-stone-500">As 5 formas reais de alimentar o banco de dados do seu app</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                  <h4 className="text-sm font-bold text-blue-950">Crowdsourcing com IA (Fotos de Notas Fiscais pelos Usuários)</h4>
                </div>
                <p className="text-xs text-stone-700 mt-2 leading-relaxed">
                  <strong>Como funciona:</strong> Os próprios usuários fotografam seus cupons fiscais ao sair do mercado (ou escaneiam pelo app) em troca de pontos, cashback ou desbloqueio de ferramentas. A IA (Gemini Vision) lê o cupom, identifica o mercado, data, produtos e preços, e alimenta o banco comunitário em segundos!
                </p>
              </div>

              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                  <h4 className="text-sm font-bold text-emerald-950">QR Code da Nota Fiscal Eletrônica (NFC-e / SEFAZ)</h4>
                </div>
                <p className="text-xs text-stone-700 mt-2 leading-relaxed">
                  <strong>Como funciona:</strong> No Brasil, todo cupom fiscal impresso possui um QR Code do sistema estadual da SEFAZ. Ao ler esse QR Code com a câmera do celular, o app acessa a chave de acesso pública e importa a lista oficial de itens registrados no caixa daquele mercado.
                </p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-stone-800 text-white font-bold text-xs flex items-center justify-center">3</span>
                  <h4 className="text-sm font-bold text-stone-900">Web Scrapers de Encartes Digitais e E-commerce</h4>
                </div>
                <p className="text-xs text-stone-700 mt-2 leading-relaxed">
                  <strong>Como funciona:</strong> Grandes redes (Carrefour, Pão de Açúcar, Atacadão, Assaí, etc.) publicam diariamente encartes promocionais em PDF e possuem sites de e-commerce. Robôs de coleta (web scrapers) lêem esses folhetos automaticamente para extrair as ofertas do dia.
                </p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-stone-800 text-white font-bold text-xs flex items-center justify-center">4</span>
                  <h4 className="text-sm font-bold text-stone-900">Parcerias Diretas com Mercados Locais e Distribuidores</h4>
                </div>
                <p className="text-xs text-stone-700 mt-2 leading-relaxed">
                  <strong>Como funciona:</strong> Supermercados de bairro e redes regionais têm interesse em divulgar suas ofertas para atrair clientes. Você pode oferecer um painel web simples onde o gerente da loja sobe a tabela de ofertas da semana.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. TECH STACK */}
        {activeSection === 'tech' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">Tecnologias Recomendadas (Stack Moderna)</h3>
                <p className="text-xs text-stone-500">O que você precisa instalar e programar</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  Frontend (App & Web)
                </div>
                <ul className="text-xs text-stone-600 space-y-1.5 list-disc pl-4">
                  <li><strong>React + Tailwind CSS</strong> para a versão Web e Painel de Gestão (como esta aplicação que você está usando).</li>
                  <li><strong>React Native (Expo)</strong> ou <strong>Flutter</strong> para criar o aplicativo para iOS e Android com suporte à câmera nativa.</li>
                </ul>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                  <Server className="w-4 h-4 text-blue-600" />
                  Backend & APIs
                </div>
                <ul className="text-xs text-stone-600 space-y-1.5 list-disc pl-4">
                  <li><strong>Node.js (Express / NestJS)</strong> para gerenciar rotas de pesquisa, login de usuários e carrinhos de compras.</li>
                  <li><strong>Google Gemini 2.5 / 3.7 Flash SDK (@google/genai)</strong> para o OCR de fotos de notas fiscais e etiquetagem inteligente.</li>
                </ul>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                  <Database className="w-4 h-4 text-amber-600" />
                  Banco de Dados & Geolocalização
                </div>
                <ul className="text-xs text-stone-600 space-y-1.5 list-disc pl-4">
                  <li><strong>PostgreSQL com extensão PostGIS</strong> ou <strong>Firestore</strong> para guardar produtos, histórico de preços e calcular a distância em km até os mercados próximos.</li>
                </ul>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                  <ScanLine className="w-4 h-4 text-purple-600" />
                  Padronização de Código de Barras (EAN / GTIN)
                </div>
                <ul className="text-xs text-stone-600 space-y-1.5 list-disc pl-4">
                  <li>Base de produtos por código de barras (EAN-13) para garantir que o "Arroz Camil 5kg" em um mercado seja agrupado com o mesmo "Arroz Camil 5kg" em outro mercado.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 4. CHALLENGES & SOLUTIONS */}
        {activeSection === 'challenges' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">Desafios Críticos e Como Resolvê-los</h3>
                <p className="text-xs text-stone-500">O que a maioria dos iniciantes erra e como você deve fazer</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <span className="text-rose-600">⚠️ Desafio 1:</span> Preços mudam muito rápido (quase todo dia)
                </h4>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  <strong>Solução:</strong> Mostre sempre a <em>"Última Atualização"</em> (Ex: "Preço de hoje às 10:30") e crie um indicador de confiabilidade baseado em quantas pessoas confirmaram aquele preço recentemente.
                </p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <span className="text-rose-600">⚠️ Desafio 2:</span> Nomes abreviados em cupons fiscais
                </h4>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  <strong>Solução:</strong> Em cupons fiscais, os nomes vêm truncados como <em>"ARR TP1 CAM 5KG"</em>. Use a inteligência artificial do Gemini para normalizar o texto para <em>"Arroz Branco Tipo 1 Camil 5kg"</em> e vincular ao código EAN universal.
                </p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <span className="text-rose-600">⚠️ Desafio 3:</span> Engajamento dos primeiros usuários (Galinha ou Ovo)
                </h4>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  <strong>Solução:</strong> Comece focado em uma única cidade ou bairro (ex: seu bairro local). Alimente os 200 produtos mais comprados (cesta básica, carnes, bebidas, higiene) escaneando os encartes semanais antes de abrir para o público.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 5. MONETIZATION */}
        {activeSection === 'business' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">Como Ganhar Dinheiro com o App? (Modelos de Receita)</h3>
                <p className="text-xs text-stone-500">4 formas reais e escaláveis de monetização</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200">
                <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  1. Afiliados de Supermercados Online (Comissão por Compra)
                </h4>
                <p className="text-xs text-stone-700 mt-1.5 leading-relaxed">
                  Grandes redes (Carrefour, Pão de Açúcar, Amazon Super, iFood Mercado) pagam entre 2% a 8% de comissão para cada compra concluída a partir do seu app.
                </p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  2. Anúncios & Destaques Promocionais de Marcas
                </h4>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Marcas como Nestlé, Ambev, Unilever e redes locais pagam para destacar suas ofertas nas primeiras posições de busca quando o usuário pesquisa categorias como "Café" ou "Cerveja".
                </p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                  3. Assinatura VIP de Ofertas / Versão PRO
                </h4>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Para famílias que fazem compras grandes ou pequenos restaurantes/comerciantes que compram no atacarejo: alertas instantâneos de queda de preço e exportações avançadas por R$ 9,90/mês.
                </p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  4. Inteligência de Mercado B2B (Dados Anônimos)
                </h4>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Indústrias alimentícias e consultorias pagam para saber qual marca está vendendo mais barato em qual bairro e como os preços oscilam semana a semana.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 6. STEP BY STEP */}
        {activeSection === 'steps' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">Roteiro Prático: Do Zero ao Lançamento em 5 Etapas</h3>
                <p className="text-xs text-stone-500">O plano de ação passo a passo</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { step: '1', title: 'Defina a Região Piloto e a Cesta Básica Inicial', desc: 'Não tente cobrir o Brasil inteiro no primeiro dia. Comece pela sua cidade ou bairro e cadastre os 100 itens mais consumidos (arroz, feijão, café, leite, carnes, limpeza).' },
                { step: '2', title: 'Construa o Frontend e o Carrinho Comparador', desc: 'Crie uma interface intuitiva onde o usuário pode buscar por produto, ver onde está mais barato e montar uma lista com a soma de economia (como neste app).' },
                { step: '3', title: 'Integre o Leitor de Cupons Fiscais com IA', desc: 'Use o Gemini Flash Vision para que os usuários possam subir fotos de cupons fiscais e gôndolas com 1 clique para alimentar os preços.' },
                { step: '4', title: 'Lance para Amigos, Família e Grupos Locais', desc: 'Divulgue em grupos de bairro no WhatsApp, condomínios e redes sociais mostrando uma comparação real (ex: "Veja como economizei R$ 80 na compra de mercado hoje").' },
                { step: '5', title: 'Adicione Monetização e Escale para Novas Redes', desc: 'Insira links de afiliados para compras online de supermercados e ofereça planos para mercados locais anunciarem encartes.' },
              ].map((s) => (
                <div key={s.step} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-start gap-3">
                  <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {s.step}
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900">{s.title}</h4>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

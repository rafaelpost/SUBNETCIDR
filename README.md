O aplicativo SubnetCIDR (Calculadora de Sub-redes e Planejador VLSM) foi criado com foco em alta precisão técnica e usabilidade profissional para engenheiros de rede, administradores de sistemas e estudantes.
Principais Funcionalidades Implementadas:
Calculadora IPv4 Completa:
Entrada Flexível: Suporta digitação direta de IP e seleção de máscara/CIDR ou colagem de notação CIDR combinada (ex: 192.168.1.1/24 ou 10.0.0.1/16).
Métricas Instantâneas: Endereço de Rede, Máscara Decimal, Máscara Curinga (Wildcard), Primeiro e Último Host Útil, Endereço de Broadcast, Capacidade Total de IPs e Hosts Válidos.
Classificação: Identificação automática de escopo (Privado RFC 1918, Público, CGNAT RFC 6598, Link-Local APIPA, Loopback, Multicast), Classe de Rede (A, B, C, D, E) e registro DNS Reverso (in-addr.arpa).
Testador de Associação de IP: Verifique em tempo real se qualquer outro endereço IP pertence à sub-rede calculada ou qual o seu índice de host.
Visualizador Binário em 32 Bits: Exibição dos 4 octetos com diferenciação cromática entre bits de rede (Network) e bits de host, destacando a linha de fronteira CIDR.
Divisor de Sub-redes (Subnet Splitter):
Fragmentação hierárquica contígua de qualquer bloco de rede em sub-redes menores (ex: dividir uma /24 em 4 sub-redes /26).
Tabela comparativa com pesquisa/filtro dinâmico e botão para carregar qualquer sub-rede gerada diretamente na calculadora.
Exportação em formato CSV e Markdown para documentação de rede.
Planejador VLSM (Variable Length Subnet Mask):
Alocação sem desperdício e sem sobreposição de blocos a partir de demandas reais por setor/departamento (ordenado decrescentemente por demanda).
Mapa Visual Proporcional: Barra gráfica horizontal interativa que ilustra a alocação exata de cada sub-rede dentro do bloco pai e o espaço livre restante para expansões futuras.
Presets prontos para cenários corporativos, acadêmicos e pequenos escritórios.
Exportação completa em CSV e tabela Markdown.
Calculadora IPv6 (128 Bits):
Expansão completa para 8 grupos hexadecimais (32 dígitos) e compressão canônica RFC 5952 com ::.
Detecção de tipos (Global Unicast, Link-Local fe80::, ULA fc00::/7, Multicast, etc.).
Cálculo de limites do prefixo, Interface ID e cálculo de capacidade de sub-redes /64.
Tabela de Referência Rápida CIDR (/0 a /32):
Guia de consulta rápida com busca instantânea por prefixo, máscara decimal, wildcard e casos de uso típicos (incluindo RFC 3021 para links ponto-a-ponto /31).
Botão para carregar qualquer prefixo diretamente no cálculo.

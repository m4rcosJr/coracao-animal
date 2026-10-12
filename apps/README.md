# Aplicativos Coração Animal

Esta pasta contém os códigos-fonte dos aplicativos Android e Windows. Os dois clientes usam a mesma API e o mesmo banco de dados hospedados no Azure, permitindo que as informações cadastradas sejam acessadas em qualquer dispositivo.

## Servidor configurado

`https://coracaoanimal-api-fqegfpe7avcda5cy.chilecentral-01.azurewebsites.net`

## Projetos

- `CoracaoAnimal.App`: aplicativo Android desenvolvido com .NET MAUI.
- `CoracaoAnimal.Windows`: aplicativo desktop para Windows.
- `CoracaoAnimal.Client`: cliente HTTP compartilhado pelos aplicativos.
- `CoracaoAnimal.Core`: contratos, modelos e regras compartilhados.

## Compilação

É necessário instalar o SDK do .NET e as cargas de trabalho correspondentes.

Android:

```powershell
dotnet workload install maui-android
dotnet publish apps/CoracaoAnimal.App/CoracaoAnimal.App.csproj -f net10.0-android -c Release
```

Windows:

```powershell
dotnet publish apps/CoracaoAnimal.Windows/CoracaoAnimal.Windows.csproj -c Release -r win-x64 --self-contained true
```

Os binários prontos para uso estão na seção **Releases** do repositório.

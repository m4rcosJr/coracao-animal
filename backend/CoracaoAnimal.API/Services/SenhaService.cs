using System.Security.Cryptography;

namespace CoracaoAnimal.API.Services
{
    /// <summary>
    /// Gera e verifica hashes de senha usando PBKDF2 (nativo do .NET — sem depender
    /// de pacote externo). Cada hash carrega seu proprio salt e numero de iteracoes,
    /// entao mesmo duas senhas iguais geram hashes diferentes no banco.
    /// </summary>
    public static class SenhaService
    {
        private const int Iteracoes = 100_000;
        private const int TamanhoSalt = 16; // bytes
        private const int TamanhoHash = 32; // bytes

        /// <summary>Gera um hash no formato "iteracoes.salt.hash" (tudo em Base64)</summary>
        public static string GerarHash(string senha)
        {
            var salt = RandomNumberGenerator.GetBytes(TamanhoSalt);
            var hash = Rfc2898DeriveBytes.Pbkdf2(senha, salt, Iteracoes, HashAlgorithmName.SHA256, TamanhoHash);

            return $"{Iteracoes}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
        }

        /// <summary>Confere se a senha digitada bate com o hash salvo no banco</summary>
        public static bool VerificarSenha(string senha, string senhaHashArmazenada)
        {
            var partes = senhaHashArmazenada.Split('.');
            if (partes.Length != 3) return false;

            var iteracoes = int.Parse(partes[0]);
            var salt = Convert.FromBase64String(partes[1]);
            var hashArmazenado = Convert.FromBase64String(partes[2]);

            var hashCalculado = Rfc2898DeriveBytes.Pbkdf2(senha, salt, iteracoes, HashAlgorithmName.SHA256, hashArmazenado.Length);

            // Comparacao em tempo constante — evita vazar informacao por timing attack
            return CryptographicOperations.FixedTimeEquals(hashCalculado, hashArmazenado);
        }
    }
}
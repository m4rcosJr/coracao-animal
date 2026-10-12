using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using CoracaoAnimal.Core;
namespace CoracaoAnimal.Client;
public interface IClientStorage { Task<string?> Read(string key); Task Write(string key,string? value); }
public sealed class ApiClient(IClientStorage storage) {
 public const string DefaultServerUrl="https://coracaoanimal-api-fqegfpe7avcda5cy.chilecentral-01.azurewebsites.net";
 readonly HttpClient http=new(new HttpClientHandler { AllowAutoRedirect=false }) { Timeout=TimeSpan.FromSeconds(30) };
 static readonly JsonSerializerOptions Json=new(JsonSerializerDefaults.Web);
 public Uri? BaseUri {get;private set;} public UsuarioDto? Usuario {get;private set;} string? token;
 public async Task Initialize(){var url=await storage.Read("url");if(url==null||!url.Contains("coracaoanimal-api-fqegfpe7avcda5cy",StringComparison.OrdinalIgnoreCase)){url=DefaultServerUrl;await storage.Write("url",url);await storage.Write("token",null);}BaseUri=ValidateUrl(url);token=await storage.Read("token");var email=await storage.Read("user-email");if(token!=null&&email!=null)Usuario=new UsuarioDto(0,await storage.Read("user-name")??"Usuário",email,await storage.Read("user-role")??"user",null,"","","cao","medio","alguma");}
 public static Uri ValidateUrl(string value){if(!Uri.TryCreate(value.Trim().TrimEnd('/')+"/",UriKind.Absolute,out var u)||u.UserInfo.Length>0||u.Query.Length>0||u.Fragment.Length>0||u.AbsolutePath!="/"||(u.Scheme!="https"&&!(u.Scheme=="http"&&(u.IsLoopback||u.Host=="10.0.2.2"))))throw new InvalidOperationException("Informe a URL HTTPS do site. HTTP é permitido apenas no computador local ou emulador.");return u;}
 public async Task Configure(string url){var next=ValidateUrl(url);if(BaseUri!=next)await Forget();BaseUri=next;await storage.Write("url",next.AbsoluteUri);}
 public async Task<T?> Send<T>(HttpMethod method,string path,object? body=null){if(BaseUri==null)throw new InvalidOperationException("Configure o endereço do servidor primeiro.");using var req=new HttpRequestMessage(method,new Uri(BaseUri,path.TrimStart('/')));req.Headers.Add("X-CSRF","1");if(token!=null)req.Headers.Authorization=new AuthenticationHeaderValue("Bearer",token);if(body!=null)req.Content=JsonContent.Create(body,options:Json);HttpResponseMessage response;try{response=await http.SendAsync(req);}catch(HttpRequestException){throw new InvalidOperationException("Não foi possível acessar o Coração Animal. Verifique sua conexão com a internet e tente novamente.");}catch(TaskCanceledException){throw new InvalidOperationException("O servidor demorou para responder. Atualize antes de repetir uma operação.");}using(response){var text=await response.Content.ReadAsStringAsync();if(!response.IsSuccessStatusCode){if(response.StatusCode==HttpStatusCode.Unauthorized)await Forget();string message=response.StatusCode==HttpStatusCode.Unauthorized?"Entre novamente para continuar.":response.StatusCode==HttpStatusCode.Forbidden?"Acesso não permitido.":"Não foi possível concluir a operação.";try{message=JsonDocument.Parse(text).RootElement.GetProperty("mensagem").GetString()??message;}catch(JsonException){}catch(KeyNotFoundException){}throw new InvalidOperationException(message);}return string.IsNullOrWhiteSpace(text)?default:JsonSerializer.Deserialize<T>(text,Json);}}
 public Task<T?> Get<T>(string path)=>Send<T>(HttpMethod.Get,path);
 public Task<T?> Post<T>(string path,object? body=null)=>Send<T>(HttpMethod.Post,path,body);
 public Task<T?> Put<T>(string path,object body)=>Send<T>(HttpMethod.Put,path,body);
 public Task<object?> Delete(string path)=>Send<object>(HttpMethod.Delete,path);
 public async Task Login(string email,string senha){var s=await Post<ApiAuthDto>("api/Auth/login",new {email,senha})??throw new InvalidOperationException("Resposta inválida.");await SetSession(s);}
 public async Task Register(string nome,string email,string senha){var s=await Post<ApiAuthDto>("api/Auth/registrar",new {nomeCompleto=nome,email,senha})??throw new InvalidOperationException("Resposta inválida.");await SetSession(s);}
 async Task SetSession(ApiAuthDto s){token=s.Token;Usuario=new UsuarioDto(0,s.NomeCompleto,s.Email,s.Tipo,null,"","","cao","medio","alguma");await storage.Write("token",token);await storage.Write("user-name",s.NomeCompleto);await storage.Write("user-email",s.Email);await storage.Write("user-role",s.Tipo);}
 public Task<UsuarioDto?> Me()=>Task.FromResult(Usuario);
 public async Task Logout(){await Forget();}
 public async Task Forget(){token=null;Usuario=null;await storage.Write("token",null);await storage.Write("user-name",null);await storage.Write("user-email",null);await storage.Write("user-role",null);}
}

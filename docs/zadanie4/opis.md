# Opis projektu: zastosowane zasady SOLID, wybrane wzorce projektowe z uzasadnieniem

## 1. Architektura i opis projektu
Aplikacja RandoM337 to internetowa platforma komunikacji wideo w czasie rzeczywistym z elementami grywalizacji (tzw. chat roulette). System opiera się na architekturze hybrydowej:
* **WebSockets (Klient-Serwer):** Odpowiada za zarządzanie stanem sesji, autoryzację, mechanizm kolejkowania (matchmaking) oraz zestawianie połączeń w architekturze WebRTC.
* **WebRTC (Peer-to-Peer):** Odpowiada za anonimowe, bezpośrednie przesyłanie strumieni wideo i audio oraz bezpieczną komunikację tekstową poprzez kanał danych (Data Channel), zabezpieczoną przed Cross-Site Scripting.

## 2. Zastosowane zasady SOLID
Architektura backendu została zaprojektowana z rygorystycznym zachowaniem zasad inżynierii oprogramowania:

* **Single Responsibility Principle (SRP):** Klasy mają jedną, ściśle określoną odpowiedzialność. Przykładowo, klasa `User` służy wyłącznie jako reprezentacja odbiorcy oprogramowania, podczas gdy operacje na połączeniach sieciowych obsługuje `ConnectionManager`, a logikę weryfikacji zgłoszeń od użytkowników realizuje `ModerationService`.
* **Open/Closed Principle (OCP):** System jest otwarty na rozbudowę, ale zamknięty na modyfikacje. Moduł `MatchmakerService` może korzystać z nowych algorytmów parowania użytkowników bez konieczności zmiany swojego głównego kodu.
* **Dependency Inversion Principle (DIP):** Moduły wysokiego poziomu (np. `UserService`, `MatchmakerService`) nie zależą od modułów niskiego poziomu (np. bazy danych, konkretnej biblioteki WebSocket). Zależą one od abstrakcji (interfejsów takich jak `IUserRepository`, `IPoolManager`, `IUserConnection`).

## 3. Wybrane wzorce projektowe z uzasadnieniem
W projekcie zastosowano następujące wzorce projektowe, rozwiązujące specyficzne problemy aplikacji czasu rzeczywistego:

### 3.1. Wzorzec Strategii (Strategy Pattern)
* **Zastosowanie:** Interfejs `IMatchStrategy` z implementacjami `RandomMatchStrategy` oraz `TagFilteredMatchStrategy`.
* **Uzasadnienie:** Aplikacja w głównej mierze anonimowo łączy dwóch użytkowników w parę do rozmowy wideo. W przypadku uwzględniania preferencji użytkownika (np. konfiguracja preferencji wyszukiwania i odrzucanie wybranych tagów wyzwań), wzorzec strategii pozwala na dynamiczne wstrzykiwanie odpowiedniego algorytmu parowania do kolejki, co zapobiega tworzeniu skomplikowanych instrukcji warunkowych w głównym serwisie.

### 3.2. Wzorzec Obserwatora (Observer Pattern / Publish-Subscribe)
* **Zastosowanie:** System obsługi zdarzeń WebSocket w warstwie sygnalizacji (nasłuchiwanie i emitowanie zdarzeń).
* **Uzasadnienie:** Klasyczny model synchroniczny (żądanie-odpowiedź) nie sprawdza się w aplikacjach, gdzie komunikacja real-time nie może prowadzić do zauważalnej desynchronizacji sesji między użytkownikami. Dzięki wzorcowi obserwatora, klienci subskrybują konkretne kanały, a serwer asynchronicznie powiadamia ich o zmianach stanu (np. w przypadku gdy rozmówca opuści czat po kliknięciu przycisku "Pomiń").

### 3.3. Wzorzec Repozytorium (Repository Pattern)
* **Zastosowanie:** Interfejsy operujące na danych, m.in. `IUserRepository`, `IReportRepository` oraz `IChallengeRepository`.
* **Uzasadnienie:** Wzorzec repozytorium całkowicie izoluje logikę dostępu do danych. Dzięki temu wdrożenie trwałej bazy danych do obsługi modułu administracyjnego (np. do trwałego zapisywania zgłoszeń i logów weryfikowanych przez moderację) będzie wymagało jedynie dodania nowej klasy implementującej dany interfejs, bez ingerencji w warstwę logiki biznesowej systemu.
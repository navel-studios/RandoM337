```mermaid
graph TD
    %% Aktorzy
    U[Użytkownik]
    M[Moderator]

    %% Bloki logiczne dla lepszej czytelności
    subgraph Komunikacja i Interakcja
        UC1((UC-01: Losowanie rozmówcy))
        UC2((UC-02: Pominięcie rozmówcy))
        UC3((UC-03: Czat tekstowy))
        UC4((UC-04: Reakcja wideo))
        UC5((UC-05: Wzajemne polubienie))
    end

    subgraph Zaangażowanie i Konfiguracja
        UC6((UC-06: Propozycja wyzwania))
        UC7((UC-07: Statystyki profilu))
        UC8((UC-08: Zmiana kamery/mikrofonu))
        UC10((UC-10: Preferencje wyszukiwania))
    end

    subgraph Bezpieczeństwo i Moderacja
        UC9((UC-09: Zgłoszenie błędu))
        UC11((UC-11: Zgłoszenie naruszenia))
        UC12((UC-12: Nakładanie blokad))
        UC13((UC-13: Weryfikacja wyzwań))
    end

    %% Relacje - Użytkownik
    U --> UC1
    U --> UC2
    U --> UC3
    U --> UC4
    U --> UC5
    U --> UC6
    U --> UC7
    U --> UC8
    U --> UC9
    U --> UC10
    U --> UC11

    %% Relacje - Moderator
    M --> UC12
    M --> UC13

    %% Zależności
    UC11 -.->|<<include>> wymusza| UC2
    UC5 -.->|<<extend>> opcjonalne podczas| UC1
    UC12 -.->|<<include>> przetwarza| UC11
    UC13 -.->|<<include>> przetwarza| UC6
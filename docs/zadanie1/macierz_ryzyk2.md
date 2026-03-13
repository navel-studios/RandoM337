# Mapa ryzyka projektu (5×5)

Legenda skali:

- **Prawdopodobieństwo / Konsekwencje**: 1 = Bardzo niska, 2 = Niska, 3 = Umiarkowana, 4 = Wysoka, 5 = Bardzo wysoka
- **Kolor komórki**: zielony = niskie ryzyko, żółty = średnie ryzyko, czerwony = wysokie ryzyko
- **Zasada koloru**: score = prawdopodobieństwo × konsekwencje  
  - 1–4 → zielony  
  - 5–9 → żółty  
  - 10–25 → czerwony

## Macierz ryzyka

<table style="border-collapse: collapse; width: 100%; table-layout: fixed; text-align: left;">
  <tr>
    <th style="border: 1px solid #999; padding: 8px; background: #f2f2f2;"></th>
    <th style="border: 1px solid #999; padding: 8px; background: #f2f2f2;">Konsekwencje 1<br/>Bardzo niska</th>
    <th style="border: 1px solid #999; padding: 8px; background: #f2f2f2;">Konsekwencje 2<br/>Niska</th>
    <th style="border: 1px solid #999; padding: 8px; background: #f2f2f2;">Konsekwencje 3<br/>Umiarkowana</th>
    <th style="border: 1px solid #999; padding: 8px; background: #f2f2f2;">Konsekwencje 4<br/>Wysoka</th>
    <th style="border: 1px solid #999; padding: 8px; background: #f2f2f2;">Konsekwencje 5<br/>Bardzo wysoka</th>
  </tr>

  <tr>
    <th style="border: 1px solid #999; padding: 8px; background: #f2f2f2;">Prawdopodobieństwo 5<br/>Bardzo wysoka</th>
    <td style="border: 1px solid #999; padding: 8px; background: #ff4d4d; vertical-align: top;"></td>
    <td style="border: 1px solid #999; padding: 8px; background: #ff4d4d; vertical-align: top;"></td>
    <td style="border: 1px solid #999; padding: 8px; background: #ff4d4d; vertical-align: top;"></td>
    <td style="border: 1px solid #999; padding: 8px; background: #ff4d4d; vertical-align: top;"></td>
    <td style="border: 1px solid #999; padding: 8px; background: #ff4d4d; vertical-align: top;"></td>
  </tr>

  <tr>
    <th style="border: 1px solid #999; padding: 8px; background: #f2f2f2;">Prawdopodobieństwo 4<br/>Wysoka</th>
    <td style="border: 1px solid #999; padding: 8px; background: #ffd966; vertical-align: top;"></td>
    <td style="border: 1px solid #999; padding: 8px; background: #ffd966; vertical-align: top;"><strong>R4</strong><br/>Nic nie działa</td>
    <td style="border: 1px solid #999; padding: 8px; background: #ff4d4d; vertical-align: top;"><strong>R2</strong><br/>Błędne/słabe testy jednostkowe, ukryte bugi/wrażliwości</td>
    <td style="border: 1px solid #999; padding: 8px; background: #ff4d4d; vertical-align: top;"><strong>R8</strong><br/>Niedopuszczalny kontent</td>
    <td style="border: 1px solid #999; padding: 8px; background: #ff4d4d; vertical-align: top;"></td>
  </tr>

  <tr>
    <th style="border: 1px solid #999; padding: 8px; background: #f2f2f2;">Prawdopodobieństwo 3<br/>Umiarkowana</th>
    <td style="border: 1px solid #999; padding: 8px; background: #ffd966; vertical-align: top;"></td>
    <td style="border: 1px solid #999; padding: 8px; background: #ffd966; vertical-align: top;"><strong>R7</strong><br/>Nieintuicyjny/bugujący/wolny interfejs</td>
    <td style="border: 1px solid #999; padding: 8px; background: #ffd966; vertical-align: top;"><strong>R5</strong><br/>Desynchronizacja sesji w real-time</td>
    <td style="border: 1px solid #999; padding: 8px; background: #ff4d4d; vertical-align: top;"><strong>R1</strong><br/>Słabe zrozumienie domeny biznesowej, brak jej zainteresowania</td>
    <td style="border: 1px solid #999; padding: 8px; background: #ff4d4d; vertical-align: top;"></td>
  </tr>

  <tr>
    <th style="border: 1px solid #999; padding: 8px; background: #f2f2f2;">Prawdopodobieństwo 2<br/>Niska</th>
    <td style="border: 1px solid #999; padding: 8px; background: #a9d18e; vertical-align: top;"><strong>R9</strong><br/>Brak mocy obliczeniowej serwerów</td>
    <td style="border: 1px solid #999; padding: 8px; background: #ffd966; vertical-align: top;"></td>
    <td style="border: 1px solid #999; padding: 8px; background: #ffd966; vertical-align: top;"></td>
    <td style="border: 1px solid #999; padding: 8px; background: #ffd966; vertical-align: top;"><strong>R3</strong><br/>Nieprzewidziane nakłady czasu, przekroczenie deadline'ów implementacji</td>
    <td style="border: 1px solid #999; padding: 8px; background: #ff4d4d; vertical-align: top;"><strong>R6</strong><br/>Cross-Site Scripting Vulnerability (XSS)</td>
  </tr>

  <tr>
    <th style="border: 1px solid #999; padding: 8px; background: #f2f2f2;">Prawdopodobieństwo 1<br/>Bardzo niska</th>
    <td style="border: 1px solid #999; padding: 8px; background: #a9d18e; vertical-align: top;"></td>
    <td style="border: 1px solid #999; padding: 8px; background: #a9d18e; vertical-align: top;"></td>
    <td style="border: 1px solid #999; padding: 8px; background: #a9d18e; vertical-align: top;"></td>
    <td style="border: 1px solid #999; padding: 8px; background: #ffd966; vertical-align: top;"></td>
    <td style="border: 1px solid #999; padding: 8px; background: #ffd966; vertical-align: top;"></td>
  </tr>
</table>

## Szybka interpretacja

- **Czerwone**: ryzyka wymagające najwyższego priorytetu.
- **Żółte**: ryzyka istotne, ale zwykle możliwe do kontrolowania przez monitoring i działania zapobiegawcze.
- **Zielone**: ryzyka niskie, nadal warte obserwacji.

## Uwaga

Macierz jest zbudowana dla układu:
- **wiersze** = prawdopodobieństwo,
- **kolumny** = konsekwencje.

W razie potrzeby mogę też przygotować wersję z:
- bardziej „ładnym” układem do oddania na zajęcia,
- legendą w stylu akademickim,
- albo tabelą ryzyk przepisanych do 5-stopniowej skali opisowej.

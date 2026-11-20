// Power Query (M) — repeatable CSV cleansing for the legacy extract.
// Excel: Data > Get Data > From File > From Text/CSV > Transform Data > Advanced Editor

let
    Source = Csv.Document(
        File.Contents("C:\Users\ADMIN\OneDrive\Desktop\erp\data\raw\legacy_transactions.csv"),
        [Delimiter = ",", Encoding = 65001, QuoteStyle = QuoteStyle.Csv]
    ),
    Promoted = Table.PromoteHeaders(Source, [PromoteAllScalars = true]),

    // Strip currency symbols, commas, and trailing ISO codes, then parse as number.
    CleanedAmount = Table.TransformColumns(
        Promoted,
        {
            {
                "debit_amount",
                each try Number.From(Text.Trim(Text.Replace(Text.Replace(Text.Replace(Text.From(_), "$", ""), ",", ""), " USD", ""))) otherwise null,
                type number
            },
            {
                "credit_amount",
                each try Number.From(Text.Trim(Text.Replace(Text.Replace(Text.Replace(Text.From(_), "$", ""), ",", ""), " USD", ""))) otherwise null,
                type number
            }
        }
    ),

    // Mixed legacy dates -> YYYY-MM-DD
    StandardizedDates = Table.TransformColumns(
        CleanedAmount,
        {
            {
                "txn_date",
                each Date.ToText(Date.From(_), "yyyy-MM-dd"),
                type text
            }
        }
    )
in
    StandardizedDates

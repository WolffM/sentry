from sentry.search.eap.columns import FormulaDefinition
from sentry.search.eap.common_formulas import make_epm, make_eps
from sentry.search.eap.occurrences.aggregates import OCCURRENCES_ALWAYS_PRESENT_ATTRIBUTES

OCCURRENCE_FORMULA_DEFINITIONS = {
    "eps": FormulaDefinition(
        default_search_type="rate",
        arguments=[],
        formula_resolver=make_eps(OCCURRENCES_ALWAYS_PRESENT_ATTRIBUTES[0]),
        is_aggregate=True,
    ),
    "epm": FormulaDefinition(
        default_search_type="rate",
        arguments=[],
        formula_resolver=make_epm(OCCURRENCES_ALWAYS_PRESENT_ATTRIBUTES[0]),
        is_aggregate=True,
    ),
}

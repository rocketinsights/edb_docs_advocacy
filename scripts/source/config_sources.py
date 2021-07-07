import json

ANSI_STOP = '\033[0m'
ANSI_BLUE = '\033[34m'
ANSI_GREEN = '\033[32m'
ANSI_YELLOW = '\033[33m'
ANSI_RED = '\033[31m'

PRODUCT_DOCS = [
    'ark',
    'bart',
    'efm',
    'epas',
    'eprs',
    'hadoop_data_adapter',
    'jdbc_connector',
    'migration_portal',
    'migration_toolkit',
    'mongo_data_adapter',
    'mysql_data_adapter',
    'net_connector',
    'ocl_connector',
    'odbc_connector',
    'pem',
    'pgbouncer',
    'pgpool',
    'postgis',
    'slony',
    'edbcloud',
]

BASE_OUTPUT = {}
BASE_OUTPUT.update({ doc : False for doc in PRODUCT_DOCS })

OPTIONS = [
    { 'index': 0, 'name': 'None (load `advocacy_docs` only)', 'key': None },
    { 'index': 1, 'name': 'All EDB Product Docs', 'output': { doc : True for doc in PRODUCT_DOCS } },
    { 'index': '1a', 'name': 'Ark Platform', 'key': 'ark', 'indent': True },
    { 'index': '1b', 'name': 'Backup and Recovery Tool', 'key': 'bart', 'indent': True },
    { 'index': '1c', 'name': 'Failover Manager', 'key': 'efm', 'indent': True },
    { 'index': '1d', 'name': 'EDB Postgres Advanced Server', 'key': 'epas', 'indent': True },
    { 'index': '1e', 'name': 'Hadoop Data Adapter', 'key': 'hadoop_data_adapter', 'indent': True },
    { 'index': '1f', 'name': 'JDBC Connector', 'key': 'jdbc_connector', 'indent': True },
    { 'index': '1g', 'name': 'Migration Portal', 'key': 'migration_portal', 'indent': True },
    { 'index': '1h', 'name': 'Migration Toolkit', 'key': 'migration_toolkit', 'indent': True },
    { 'index': '1i', 'name': '.NET Connector', 'key': 'net_connector', 'indent': True },
    { 'index': '1j', 'name': 'OCL Connector', 'key': 'ocl_connector', 'indent': True },
    { 'index': '1k', 'name': 'ODBC Connector', 'key': 'odbc_connector', 'indent': True },
    { 'index': '1l', 'name': 'Postgres Enterprise Manager', 'key': 'pem', 'indent': True },
    { 'index': '1m', 'name': 'PgBouncer', 'key': 'pgbouncer', 'indent': True },
    { 'index': '1n', 'name': 'Pgpool-II', 'key': 'pgpool', 'indent': True },
    { 'index': '1o', 'name': 'PostGIS', 'key': 'postgis', 'indent': True },
    { 'index': '1p', 'name': 'Slony Replication', 'key': 'slony', 'indent': True },
    { 'index': '1q', 'name': 'Mongo Data Adapter', 'key': 'mongo_data_adapter', 'indent': True },
    { 'index': '1r', 'name': 'MySQL Data Adapter', 'key': 'mysql_data_adapter', 'indent': True },
    { 'index': '1s', 'name': 'Replication Server', 'key': 'eprs', 'indent': True },
    { 'index': '1t', 'name': 'EDB Cloud', 'key': 'edbcloud', 'indent': True },
]

print('Which sources would you like loaded when you run `yarn develop`?')
for i, option in enumerate(OPTIONS):
    print("{2}{0}: {1}".format(
        option['index'],
        option['name'],
        '  ' if option.get('indent') else '',
    )
)

selections = []
while len(selections) == 0:
    user_input = input('Enter your choices separated by commas, e.g. "1b,1m": ')

    split_user_input = user_input.strip().split(',')
    for selection_index in split_user_input:
        for option in OPTIONS:
            if str(option['index']) == selection_index:
                selections.append(option)
                break

    if len(selections) != len(split_user_input):
        print(ANSI_RED + 'Invalid input' + ANSI_STOP)

for option in selections:
    print(ANSI_BLUE + 'Selected {0}'.format(option['name']) + ANSI_STOP)

with open('dev-sources.json', 'w') as outfile:
    output = BASE_OUTPUT.copy()
    for option in selections:
        if option.get('output'):
            output.update(option['output'])
        elif option.get('key'):
            output[option['key']] = True
    json.dump(output, outfile, indent=2)
    print(ANSI_GREEN + 'Wrote to dev-sources.json' + ANSI_STOP)


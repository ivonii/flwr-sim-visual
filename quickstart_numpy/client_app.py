"""ClientApp: menentukan klien Flower dan entri client_fn."""

from flwr.client import ClientApp, NumPyClient
from flwr.common import Context

from quickstart_numpy.task import (
    initialize_model,
    get_model_params,
    set_model_params,
    train,
    test,
    load_data,
)


class FlowerClient(NumPyClient):
    """Klien Flower yang melatih/mengEvaluasi model NumPy dummy."""

    def __init__(self, model, X_train, y_train, X_test, y_test, cid: str):
        self.model = model
        self.X_train = X_train
        self.y_train = y_train
        self.X_test = X_test
        self.y_test = y_test
        self.cid = cid

    def get_parameters(self, config):
        """Kembalikan parameter model saat ini ke server."""
        return get_model_params(self.model)

    def fit(self, parameters, config):
        """Latih model secara lokal dan kirim parameter terbaru."""
        set_model_params(self.model, parameters)

        epochs = int(config.get("epochs", 1))
        learning_rate = float(config.get("learning_rate", 0.1))
        train(self.model, self.X_train, self.y_train, epochs=epochs, lr=learning_rate)

        return get_model_params(self.model), len(self.X_train), {}

    def evaluate(self, parameters, config):
        """Evaluasi model pada data uji lokal."""
        set_model_params(self.model, parameters)

        loss, accuracy = test(self.model, self.X_test, self.y_test)
        return float(loss), len(self.X_test), {"accuracy": float(accuracy)}


def client_fn(context: Context):
    """Buat FlowerClient yang mewakili satu klien/partisi."""
    partition_id = int(context.node_config.get("partition-id", 0))
    X_train, y_train, X_test, y_test = load_data()
    model = initialize_model(X_train.shape[1])

    return FlowerClient(model, X_train, y_train, X_test, y_test, cid=str(partition_id)).to_client()


app = ClientApp(client_fn=client_fn)

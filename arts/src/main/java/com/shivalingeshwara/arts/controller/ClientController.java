package com.shivalingeshwara.arts.controller;

import com.shivalingeshwara.arts.model.Client;
import com.shivalingeshwara.arts.model.ClientOrder;
import com.shivalingeshwara.arts.model.ClientPayment;
import com.shivalingeshwara.arts.repository.ClientRepository;
import com.shivalingeshwara.arts.service.ClientService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/clients")
public class ClientController {

    private final ClientRepository clientRepository;
    private final ClientService clientService;

    public ClientController(ClientRepository clientRepository,
                            ClientService clientService) {
        this.clientRepository = clientRepository;
        this.clientService = clientService;
    }

    // =========================================
    // 1️⃣ LIST ALL CLIENTS (GRID PAGE)
    // =========================================
    @GetMapping
    public String listClients(Model model) {
    
        List<Client> clients = clientService.getAllClients();
    
        Map<Long, Long> clientOrderCounts = new HashMap<>();
    
        for (Client client : clients) {
            long count = clientService.getOrderCount(client.getId());
            clientOrderCounts.put(client.getId(), count);
        }
    
        model.addAttribute("clients", clients);
        model.addAttribute("clientOrderCounts", clientOrderCounts);
    
        return "clients/list";
    }
    
    
    // =========================================
    // 2️⃣ OPEN SINGLE CLIENT LEDGER PAGE
    // =========================================
@GetMapping("/{id}/ledger")
@ResponseBody
public Map<String, Object> getClientLedger(@PathVariable Long id) {

    Client client = clientService.getClientById(id);

    List<ClientOrder> orders = clientService.getOrdersByClient(id);

    double totalBilled = clientService.getTotalBilled(id);
    double totalReceived = clientService.getTotalReceived(id);
    double outstanding = totalBilled - totalReceived;

    Map<String, Object> map = new HashMap<>();
    map.put("clientName", client.getName());
    map.put("totalOrders", orders.size());
    map.put("totalBilled", totalBilled);
    map.put("totalReceived", totalReceived);
    map.put("outstanding", outstanding);
    map.put("orders", orders);

    return map;
}

@PostMapping("/{id}/orders")
@ResponseBody
public Map<String, String> addClientOrder(
        @PathVariable Long id,
        @RequestBody ClientOrder order) {

    clientService.addOrderToClient(id, order);

    return Map.of("status", "success");
}

@DeleteMapping("/orders/{orderId}")
@ResponseBody
public Map<String, String> deleteClientOrder(@PathVariable Long orderId) {

    clientService.deleteClientOrder(orderId);

    return Map.of("status", "deleted");
}

@PutMapping("/orders/{orderId}")
@ResponseBody
public Map<String, String> updateClientOrder(
        @PathVariable Long orderId,
        @RequestBody Map<String, Object> data) {

    clientService.updateClientOrder(orderId, data);

    return Map.of("status", "updated");
}




    // =========================================
    // 3️⃣ CREATE CLIENT
    // =========================================
@PostMapping("/save")
public String saveClient(@RequestParam String name,
                         @RequestParam String phone) {

    Client client = new Client();
    client.setName(name);
    client.setPhone(phone);
    client.setTotalBalance(0.0);
    client.setActive(true);

    clientService.saveClient(client);

    return "redirect:/clients";
}


    // =========================================
    // 4️⃣ UPDATE CLIENT
    // =========================================
@GetMapping("/{id}/json")
@ResponseBody
public Client getClientJson(@PathVariable Long id) {
    return clientService.getClientById(id);
}


@PostMapping("/update/{id}")
public String updateClient(@PathVariable Long id,
                           @ModelAttribute Client client) {

    Client existing = clientService.getClientById(id);

    existing.setName(client.getName());
    existing.setPhone(client.getPhone());

    clientService.saveClient(existing);

    return "redirect:/clients";
}


    // =========================================
    // 5️⃣ DELETE CLIENT
    // =========================================
@GetMapping("/delete/{id}")
public String deleteClient(@PathVariable Long id,
                           RedirectAttributes redirectAttributes) {

    clientService.deleteClient(id);

    redirectAttributes.addFlashAttribute(
        "successMessage",
        "Client and all related records deleted successfully!"
    );

    return "redirect:/clients";
}




    // =========================================
    // 6️⃣ DISABLE CLIENT
    // =========================================
@GetMapping("/toggle/{id}")
public String toggleClient(@PathVariable Long id) {

    Client client = clientService.getClientById(id);

    if (client != null) {
        client.setActive(!client.isActive());
        clientService.saveClient(client);
    }

    return "redirect:/clients";
}

@GetMapping("/{clientId}/summary")
@ResponseBody
public Map<String, Object> getClientSummary(@PathVariable Long clientId) {

    Map<String, Object> map = new HashMap<>();

Client client = clientService.getClientById(clientId);

double totalPaid = clientService.getTotalPaid(clientId);
double totalBilled = client.getTotalBalance();
double outstanding = totalBilled - totalPaid;

map.put("totalBilled", totalBilled);
map.put("totalPaid", totalPaid);
map.put("outstanding", outstanding);

    return map;
}

@PostMapping("/{clientId}/pay")
@ResponseBody
public Map<String, Object> payClient(@PathVariable Long clientId,
                                     @RequestParam Double amount,
                                     @RequestParam String method) {

    Map<String, Object> response = new HashMap<>();

    double outstanding = clientService.getOutstandingBalance(clientId);

    if (amount == null || amount <= 0) {
        response.put("success", false);
        response.put("message", "Invalid amount");
        return response;
    }

    if (amount > outstanding) {
        response.put("success", false);
        response.put("message", "Payment exceeds outstanding balance");
        return response;
    }

    Client client = clientService.getClientById(clientId);

    ClientPayment payment = new ClientPayment();
    payment.setClient(client);
    payment.setAmount(amount);
    payment.setMethod(method);
    payment.setPaymentDate(java.time.LocalDateTime.now());

    clientService.saveClientPayment(payment);

    response.put("success", true);
    response.put("newOutstanding", clientService.getOutstandingBalance(clientId));
    response.put("newTotalPaid", clientService.getTotalPaid(clientId));

    return response;
}

@GetMapping("/{clientId}/payments/json")
@ResponseBody
public List<ClientPayment> getClientPayments(@PathVariable Long clientId) {
    return clientService.getClientPayments(clientId);
}


}
